import {
  Args,
  Context,
  Mutation,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import {
  AddMemberToInnerCircleInput,
  AddMemberToListInput,
  PageInfo,
  RemoveMemberFromInnerCircleInput,
  RemoveMemberFromListInput,
  UpdateMemberListOutput,
  User as GqlUser,
  UserList,
  UserListMembersEdge as GqlUserListMembersEdge,
  UserLists,
  UserListsEdge,
  UserListWithMembers,
  PaginationInput,
} from '@verdzie/server/generated-graphql';
import { AppContext } from '@verdzie/server/common';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import _ from 'lodash';
import { User } from '@verdzie/server/graphql';
import {
  AddMemberToICResponse,
  kEmptyGqlPageInfo,
  UserService,
} from '@verdzie/server/user/user.service';
import { GraphQLExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { kSomethingWentWrong } from '../../constants';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { UserResolver } from '@verdzie/server/user/resolvers/user.resolver';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { getGqlPageInfoFromPaginatedResponse } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';

@Resolver('User')
@UseGuards(JwtAuthGuard)
export class UserListResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly service: UserListService,
    private readonly userService: UserService,
    private readonly userResolver: UserResolver,
    private readonly feedService: FeedService
  ) {
    this.logger = this.logger.child({ context: UserListResolver.name });
  }

  @ResolveField(() => UserLists, { name: 'allCreatedLists' })
  async allCreatedLists(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UserLists | undefined> {
    if (currentUser === undefined) {
      this.logger.error('CurrentUser is undefined');
      return;
    }
    const response = await this.service.paginateAllListsCreatedByUser(
      currentUser.id,
      paginationInput
    );
    if (!response) return;
    const edges: UserListsEdge[] = [];
    for (const entity of response.listEntities) {
      edges.push({
        __typename: 'UserListsEdge',
        cursor: entity.id,
        node: await this.service.toGqlObj(entity),
      });
    }
    return {
      __typename: 'UserLists',
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage,
        startCursor: _.first(response.listEntities)?.id ?? '',
        endCursor: _.last(response.listEntities)?.id ?? '',
      },
      edges,
    };
  }

  async getSuggestionsList(
    paginationInput: PaginationInput,
    ctx: AppContext,
    innerCircle: UserListEntity,
    currentUser?: UserEntity
  ): Promise<UserListWithMembers | undefined> {
    this.logger.info('getSuggestionsList', { paginationInput });
    if (!currentUser) return;
    const suggestionsFeed =
      await this.userService.findOrCreateInnerCirclesSuggestionFeed(
        currentUser.id
      );
    if (!suggestionsFeed) {
      this.logger.info('Suggestions feed not found');
      return {
        __typename: 'UserListWithMembers',
        details: await this.service.toGqlObj(innerCircle),
        isSuggestion: true,
        members: {
          __typename: 'UserListMembersList',
          pageInfo: kEmptyGqlPageInfo,
          edges: [],
        },
      };
    }
    const suggestionsFeedId = suggestionsFeed.id;
    const response = await this.feedService.paginateEntries(
      suggestionsFeedId,
      paginationInput
    );
    const users: UserEntity[] = await this.userService.findAllById(
      response.ids
    );
    const entries: User[] = users
      .map(user => this.userService.toUserObject({ user }))
      .filter((user): user is User => user !== undefined)
      .map(user => {
        user.currentUserContext = {
          __typename: 'UserContext',
          followingUser: true,
          isInnerCircle: false,
        };
        return user;
      });
    return {
      __typename: 'UserListWithMembers',
      details: await this.service.toGqlObj(innerCircle),
      isSuggestion: true,
      members: {
        __typename: 'UserListMembersList',
        pageInfo: getGqlPageInfoFromPaginatedResponse(response),
        edges: entries.map(node => {
          return {
            __typename: 'UserListMembersEdge',
            node,
            cursor: node.id,
          };
        }),
      },
    };
  }

  private async getGQLUserListWithMembers(
    entityOrId: UserListEntity | string,
    paginationInput: PaginationInput,
    ctx: AppContext,
    currentUser?: UserEntity
  ): Promise<UserListWithMembers> {
    this.logger.info('getUserListWithMembers', {});
    let edges: GqlUserListMembersEdge[] = [];
    let gqlListEntity: UserList = {
      __typename: 'UserList',
      id: '',
      memberCount: 0,
      name: 'Inner Circle',
      iconUrl: '',
    };
    let pageInfo: PageInfo = kEmptyGqlPageInfo;
    if (currentUser) {
      const innerCircleEntity =
        typeof entityOrId === 'string'
          ? await this.service.findById(entityOrId)
          : entityOrId;
      if (innerCircleEntity) {
        gqlListEntity = await this.service.toGqlObj(innerCircleEntity);
        const paginatedResult = await this.service.paginateMemberGqlUsers(
          innerCircleEntity.id,
          paginationInput,
          this.userService
        );
        pageInfo = {
          __typename: 'PageInfo',
          startCursor: _.first(paginatedResult.users)?.id ?? '',
          endCursor: _.last(paginatedResult.users)?.id ?? '',
          hasPreviousPage: paginatedResult.hasPreviousItems,
          hasNextPage: paginatedResult.hasMoreItems,
          pageNumber: paginatedResult.pageNumber,
        };
        edges = paginatedResult.users.map((userObj: GqlUser) => {
          return {
            __typename: 'UserListMembersEdge',
            node: {
              ...userObj,
              currentUserContext: {
                ...userObj.currentUserContext,
                isInnerCircle: true,
              },
            },
            cursor: userObj.id,
          };
        });
      } else {
        this.logger.info('ENTITY NOT FOUND', {});
      }
    } else {
      this.logger.error('CurrentUser = null');
    }
    return {
      __typename: 'UserListWithMembers',
      details: gqlListEntity,
      members: {
        __typename: 'UserListMembersList',
        pageInfo,
        edges,
      },
    };
  }

  @ResolveField(() => UserListWithMembers, { name: 'singleList' })
  async singleListWithMembers(
    @Args('id') id: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UserListWithMembers | undefined> {
    return await this.getGQLUserListWithMembers(
      id,
      paginationInput,
      ctx,
      currentUser
    );
  }

  @ResolveField(() => UserListWithMembers, { name: 'innerCircleList' })
  async innerCircleList(
    @Context() ctx: AppContext,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('isSuggestion') isSuggestion?: boolean,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UserListWithMembers | undefined> {
    this.logger.info('innerCircleList', {});
    if (!currentUser) {
      this.logger.error('CurrentUser = null');
      return;
    }
    let innerCircle = await this.service.findInnerCircleByOwnerId(
      currentUser.id,
      paginationInput.pageNumber ?? undefined
    );
    if (!innerCircle) {
      innerCircle = await this.service.createInnerCircleList(currentUser.id);
      if (!innerCircle) {
        this.logger.info('Inner Circle Not found');
        return {
          __typename: 'UserListWithMembers',
        };
      }
    }
    this.logger.info('stats', {
      count: currentUser.getStats().innerCircleCount,
    });
    if (isSuggestion) {
      this.logger.debug('ONLY SHOWING SUGGESTION', {
        count: !currentUser.getStats().innerCircleCount,
        isSuggestion,
      });
      const suggestionsList = await this.getSuggestionsList(
        paginationInput,
        ctx,
        innerCircle,
        currentUser
      );
      if (suggestionsList) return suggestionsList;
    }
    const result = await this.getGQLUserListWithMembers(
      innerCircle.id,
      paginationInput,
      ctx,
      currentUser
    );
    if (result.members && result.members.edges) {
      result.members.edges = result.members.edges.map(edge => {
        edge.node.currentUserContext = {
          __typename: 'UserContext',
          isInnerCircle: true,
          followingUser: false,
        };
        return edge;
      });
    }
    if ((result.members?.edges?.length ?? 0) < (paginationInput.take ?? 1)) {
      this.logger.debug('ADDING SUGGESTION', {});
      const suggestionsList = await this.getSuggestionsList(
        paginationInput,
        ctx,
        innerCircle,
        currentUser
      );
      if (suggestionsList) {
        this.logger.info('MERGING LISTS', {});
        result.isSuggestion = true;
        const startCursor = result.members?.pageInfo.startCursor ?? '';
        const endCursor = suggestionsList.members?.pageInfo.endCursor ?? '';
        const edges = result.members?.edges ?? [];
        edges.push(...(suggestionsList.members?.edges ?? []));
        const pageInfo = suggestionsList.members!.pageInfo;
        pageInfo.startCursor = startCursor;
        pageInfo.endCursor = endCursor;
        if (!result.members) {
          result.members = {
            __typename: 'UserListMembersList',
            pageInfo,
            edges: [],
          };
        }
        result.members.edges = edges;
      }
    }
    return result;
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  async addMemberToInnerCircle(
    @Args('input') input: AddMemberToInnerCircleInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() ctx: AppContext
  ): Promise<UpdateMemberListOutput> {
    this.logger.info('addMemberToInnerCircle', {});
    try {
      const isFollowing = await this.userService.isFollowing(
        currentUser.id,
        input.memberId
      );
      if (!isFollowing) {
        return {
          __typename: 'SmartError',
          message: 'You need to follow this user first',
        };
      }
      const result: AddMemberToICResponse | undefined =
        await this.userService.addMemberToInnerCircle(
          currentUser,
          input.memberId
        );
      if (!result) {
        return {
          __typename: 'SmartError',
          message: kSomethingWentWrong,
        };
      }
      const updatedUser = result.owner;
      const listDetails = result.innerCircle;
      ctx.req.user.getStats().innerCircleCount =
        listDetails.metaData?.memberCount;
      this.logger.info('Set inner circle count', {
        userId: ctx.req.user.id,
        count: ctx.req.user.getStats().innerCircleCount,
      });
      return {
        __typename: 'UpdateListResult',
        owner: this.userService.toUserObject({
          user: updatedUser,
          isCurrentUserRequestingTheirDetails: true,
        }),
        listDetails: {
          __typename: 'UserList',
          id: listDetails.id,
          name: listDetails.name,
          iconUrl: listDetails.iconUrl,
          memberCount: listDetails.metaData?.memberCount ?? 0,
        },
      };
    } catch (e) {
      this.logger.error(e);
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  async addMemberToList(
    @Args('input') input: AddMemberToListInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<UpdateMemberListOutput> {
    try {
      const result = await this.service.addMemberToList(
        currentUser.id,
        input.id,
        input.memberId
      );
      if (!result) {
        this.logger.info('Empty result', {});
        return {
          __typename: 'SmartError',
          message: kSomethingWentWrong,
        };
      }
      const userDetails = result.entity as UserListEntity;
      return {
        __typename: 'UpdateListResult',
        listDetails: {
          __typename: 'UserList',
          id: userDetails.id,
          name: userDetails.name,
          iconUrl: userDetails.iconUrl,
          memberCount: userDetails.metaData?.memberCount,
        },
      };
    } catch (e) {
      this.logger.error(e);
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  async removeMemberFromList(
    @Args('input') input: RemoveMemberFromListInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<UpdateMemberListOutput> {
    try {
      const userListEntity = await this.service.removeMemberFromList(
        currentUser.id,
        input.id,
        input.memberId
      );
      return {
        __typename: 'UpdateListResult',
        listDetails: {
          __typename: 'UserList',
          id: userListEntity.id,
          name: userListEntity.name,
          iconUrl: userListEntity.iconUrl,
          memberCount: userListEntity.metaData?.memberCount,
        },
      };
    } catch (e) {
      this.logger.error(e);
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  async removeMemberFromInnerCircle(
    @Args('input') input: RemoveMemberFromInnerCircleInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() ctx: AppContext
  ): Promise<UpdateMemberListOutput> {
    this.logger.info('RemoveMemberFromInnerCircle', {});
    try {
      const result: [UserEntity, UserListEntity] | undefined =
        await this.userService.removeMemberFromInnerCircle({
          owner: currentUser,
          entryToRemove: input.memberId,
        });
      if (!result) {
        return {
          __typename: 'SmartError',
          message: kSomethingWentWrong,
        };
      }
      const updatedUser = result[0];
      const listDetails = result[1];
      return {
        __typename: 'UpdateListResult',
        owner: this.userService.toUserObject({
          user: updatedUser,
          isCurrentUserRequestingTheirDetails: true,
        }),
        listDetails: {
          __typename: 'UserList',
          id: listDetails.id,
          name: listDetails.name,
          iconUrl: listDetails.iconUrl,
          memberCount: listDetails.metaData?.memberCount,
        },
      };
    } catch (e) {
      this.logger.error(e);
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
  }
}
