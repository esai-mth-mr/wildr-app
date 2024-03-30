import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GraphQLExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '@verdzie/server/auth/jwt-auth.guard';
import { SignupFirebaseJwtAuthGuard } from '@verdzie/server/auth/signup-auth.guard';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { getPassFailState } from '@verdzie/server/data/common';
import {
  BlockedUsersList,
  FirebaseAuthEmailInput,
  FirebaseAuthOutput,
  FirebaseAuthPhoneNumberInput,
  FirebaseSignupInput,
  FirebaseSignupOutput,
  FollowUserInput,
  FollowUserOutput,
  GetFollowersListInput,
  DeleteFirebaseUserArgs as GetOrDeleteFirebaseUserArgs,
  UpdateRealIdVerificationInput as GqlUpdateRealIdVerificationInput,
  LoginOutput,
  SignUpOutput,
  SignUpWithEmailInput,
  SignUpWithPhoneNumberInput,
  UnfollowUserInput,
  UnfollowUserOutput,
  User,
  UserContext,
  UserFollowersList,
  UserFollowingsEdge,
  UserFollowingsList,
  WildrVerifiedManualReviewInput,
} from '@verdzie/server/graphql';
import { MailGunService } from '@verdzie/server/mail-gun/mail-gun.service';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import {
  UserListVisibility,
  toUserListVisibility,
} from '@verdzie/server/user/data/userListVisibility';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import _, { isString } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { GqlAuthGuard } from '@verdzie/server/auth/auth.guard';
import {
  CurrentEmail,
  CurrentIdToken,
  CurrentUID,
  CurrentUser,
} from '@verdzie/server/auth/current-user';
import {
  AppContext,
  delay,
  somethingWentWrongSmartError,
  takenDownAccountSmartError,
} from '@verdzie/server/common';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { FirebaseAuthGuard } from '@verdzie/server/firebase-auth/firebase-auth.guard';
import { FirebaseAuthService } from '@verdzie/server/firebase-auth/firebase-auth.service';
import {
  BlockUserInput,
  BlockUserOutput,
  Check3rdPartyOutput,
  CheckEmailOutput,
  CheckHandleOutput,
  CommentEmbargoOnboardingLiftedOutput,
  FeedScopeType,
  FeedType,
  UpdateRealIdVerificationInput as GenGqlUpdateRealIdVerificationInput,
  Get3rdPartyDetailsOutput,
  GetBlockListOutput,
  GetFollowersListOutput,
  GetFollowingsListInput,
  GetFollowingsListOutput,
  GetInviteCodeInput,
  GetInviteCodeOutput,
  GetOrDeleteFirebaseUserOutput,
  GetUserInput,
  GetUserOutput,
  UpdateListVisibilityInput as GqlUpdateListVisibilityInput,
  UpdateListVisibilityOutput as GqlUpdateListVisibilityOutput,
  WildrVerifiedManualReviewInput as GqnGqlWildrVerifiedManualReviewInput,
  InviteEdge,
  InvitesConnection,
  InvitesConnectionInput,
  IsEmailVerifiedOutput,
  OnboardingStats,
  OnboardingUpdateOutput,
  PassFailState,
  PhoneNumberAccountExistInput,
  PhoneNumberUserExistsOutput,
  RemoveFollowerInput,
  RemoveFollowerOutput,
  ReportUserInput,
  ReportUserOutput,
  RequestDeleteUserOutput,
  SendEmailVerificationOutput,
  SmartError,
  UnblockUserInput,
  UnblockUserOutput,
  UpdateBioInput,
  UpdateBioOutput,
  UpdateCategoryInterestsInput,
  UpdateCategoryInterestsOutput,
  UpdateEmailInput,
  UpdateEmailOutput,
  UpdateFCMTokenInput,
  UpdateFCMTokenOutput,
  UpdateHandleInput,
  UpdateHandleOutput,
  UpdateLastSeenCursorInput,
  UpdateLastSeenCursorOutput,
  UpdateNameInput,
  UpdateNameOutput,
  UpdateOnboardingInput,
  UpdatePhoneNumberInput,
  UpdatePhoneNumberOutput,
  UpdatePostTypeInterestsInput,
  UpdatePostTypeInterestsOutput,
  UpdatePronounInput,
  UpdatePronounOutput,
  UpdateRealIdVerificationOutput,
  UpdateUserAvatarInput,
  UpdateUserAvatarOutput,
  WildrVerifiedManualReviewOutput,
} from '@verdzie/server/generated-graphql';
import {
  Check3rdPartyArgs,
  CheckEmailArgs,
  CheckHandleArgs,
  LoginArgs,
} from '../args';
import { UserService } from '@verdzie/server/user/user.service';
import { UserEntity, UserLoginResult } from '@verdzie/server/user/user.entity';
import { InviteListService } from '@verdzie/server/invite-lists/invite-list.service';
import { InviteListTransporter } from '@verdzie/server/invite-lists/invite-list.transporter';

@Resolver('User')
export class UserResolver {
  constructor(
    private userService: UserService,
    private feedService: FeedService,
    private firebaseAuthService: FirebaseAuthService,
    private mailGunService: MailGunService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly inviteListService: InviteListService,
    private readonly inviteListTransporter: InviteListTransporter
  ) {
    this.logger = this.logger.child({ context: 'UserResolver' });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getUser(
    @Args('input') input: GetUserInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetUserOutput> {
    try {
      const userToGet = await this.findUserById(input.id, currentUser);
      if (!userToGet) {
        this.logger.warn('[user.service] getUser user not found', {
          user: input.id,
        });
        return {
          __typename: 'SmartError',
          message: 'User not found',
        };
      }
      if (currentUser) {
        const hasBeenBlocked = await this.userService.hasBlocked({
          userWhoBlocked: userToGet,
          userIdToCheck: currentUser.id,
        });
        if (hasBeenBlocked) {
          this.logger.warn('hasBeenBlocked by the user to get', {
            user: input.id,
            currentUserId: currentUser.id,
          });
          return {
            __typename: 'SmartError',
            message: 'User not found',
          };
        }
      }

      if (currentUser) {
        ctx.isAvailable = await this.userService.isAvailable(
          currentUser,
          input.id
        );
        ctx.hasBlockedUserToGet = await this.userService.hasBlocked({
          userWhoBlocked: currentUser,
          userIdToCheck: input.id,
        });
      } else {
        ctx.isAvailable = userToGet.isAlive();
      }
      ctx.user = userToGet;
      return {
        __typename: 'GetUserResult',
        user: this.userService.toUserObject({
          user: userToGet,
          hasBlocked: ctx.hasBlockedUserToGet,
          isAvailable: ctx.isAvailable,
          isCurrentUserRequestingTheirDetails: currentUser?.id === userToGet.id,
        }),
      };
    } catch (error) {
      this.logger.error('Error while getting user information: ', {
        error,
      });
      return {
        __typename: 'SmartError',
        message: 'Error while getting user information',
      };
    }
  }

  @ResolveField()
  @UseGuards(OptionalJwtAuthGuard)
  async currentUserContext(
    @Parent() user: User,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UserContext | undefined> {
    if (!currentUser || !user) {
      return undefined;
    }
    if (user.currentUserContext) {
      this.logger.info('CurrentUserContext already set', {
        handle: user.handle,
        context: JSON.stringify(user.currentUserContext),
      });
      return user.currentUserContext;
    }
    const followingUser = (ctx.req.body.query as string).includes(
      'followingUser'
    )
      ? await this.userService.isFollowing(currentUser.id, user.id)
      : false;
    const isInnerCircle = (ctx.req.body.query as string).includes(
      'isInnerCircle'
    )
      ? await this.userService.isPartOfInnerCircle(currentUser.id, user.id)
      : false;
    return {
      __typename: 'UserContext',
      followingUser,
      isInnerCircle,
    };
  }

  @ResolveField()
  async hasPersonalizedFeed(
    @Parent() parent: User,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<boolean | undefined> {
    if (!currentUser) return undefined;
    if (currentUser.id !== parent.id) return undefined;
    return currentUser.didFinishOnboarding ?? false;
  }

  @ResolveField()
  async isAvailable(
    @Parent() parent: User,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<boolean> {
    if (!currentUser || !parent) return true;
    return this.userService.isAvailable(currentUser, parent.id);
  }

  @ResolveField()
  async hasBlocked(
    @Parent() parent: User,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<boolean | undefined> {
    if (!currentUser || !parent) return undefined;
    if (!!parent.hasBlocked) return parent.hasBlocked;
    return this.userService.hasBlocked({
      userWhoBlocked: currentUser,
      userIdToCheck: parent.id,
    });
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async followUser(
    @Args('input') input: FollowUserInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<FollowUserOutput> {
    this.logger.debug('Input:', { input });
    if (!currentUser.isAlive()) {
      this.logger.info('followUser() User TAKEN_DOWN', {
        id: currentUser.id,
      });
      return takenDownAccountSmartError;
    }
    const userWhoFollowed = await this.userService.followUser(
      currentUser.id,
      input.userId
    );
    if (!userWhoFollowed) {
      this.logger.error('User who followed is empty');
      return {
        __typename: 'SmartError',
        message: 'Error following user',
      };
    }
    return {
      __typename: 'FollowUserResult',
      currentUser: this.userService.toUserObject({
        user: userWhoFollowed,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async unfollowUser(
    @Args('input') input: UnfollowUserInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<UnfollowUserOutput> {
    const logTag = { currentUser: currentUser.id, followingUser: input.userId };
    try {
      this.logger.debug('unfollow user', { ...logTag });
      const user = await this.userService.unfollowUser(
        currentUser,
        input.userId
      );
      if (!user) {
        this.logger.error('Target user not found, cannot follow', {
          ...logTag,
        });
      } else
        return {
          __typename: 'UnfollowUserResult',
          currentUser: this.userService.toUserObject({
            user,
            isCurrentUserRequestingTheirDetails: true,
          }),
        };
    } catch (error) {
      this.logger.error('Error while following: ', { ...logTag, error });
    }
    return this.smartError('Error following user');
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async removeFollower(
    @Args('input') input: RemoveFollowerInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<RemoveFollowerOutput> {
    try {
      const user = await this.userService.removeFollower(
        currentUser,
        input.userId
      );
      if (user) {
        return {
          __typename: 'RemoveFollowerResult',
          currentUser: this.userService.toUserObject({
            user,
            isCurrentUserRequestingTheirDetails: true,
          }),
        };
      }
    } catch (error) {
      this.logger.error('Error while removing follower: ', { error });
    }
    return this.smartError('Error while removing follower');
  }

  //Followers List
  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getFollowersList(
    @Args('input') input: GetFollowersListInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetFollowersListOutput> {
    try {
      const user = await this.findUserById(input.userId, currentUser);
      if (!user) {
        return this.smartError('User not found');
      }
      const isCurrentUserRequestingTheirDetails =
        currentUser?.id === input.userId;
      if (
        user.visibilityPreferences?.list.follower === UserListVisibility.NONE &&
        !isCurrentUserRequestingTheirDetails
      ) {
        this.logger.info('Ignoring followers list', {});
        return this.smartError('User has hidden their followers list');
      }
      ctx.user = user;
      return {
        __typename: 'GetFollowersListResult',
        user: this.userService.toUserObject({
          user,
          isCurrentUserRequestingTheirDetails,
        }),
      };
    } catch (error) {
      this.logger.error('Error while getting user following list: ', {
        error,
      });
      return this.smartError();
    }
  }

  @ResolveField(() => UserFollowersList, { name: 'followersList' })
  async followersList(
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity,
    @Context('user') user?: UserEntity
  ): Promise<UserFollowersList | undefined> {
    if (!user) return undefined;
    if (currentUser && user) {
      const hasBlockedFromEitherSide: boolean =
        await this.userService.hasBlockedFromEitherSide({
          userA: currentUser,
          userB: user,
        });
      if (hasBlockedFromEitherSide) {
        this.logger.info('followersList() hasBlockedFromEitherSide');
        return undefined;
      }
    }
    const followerFeedId = user.followerFeedId ?? '';
    const followerFeed = await this.feedService.find(followerFeedId);
    if (!followerFeed) {
      this.logger.error('No follower feed found for user', {
        user: user.id,
      });
      return undefined;
    }
    const [page, hasPreviousPage, hasNextPage] =
      (await this.feedService.getPage({
        feedOrId: followerFeed,
        first,
        after,
        last,
        before,
      })) ?? [[], false, false];
    followerFeed.page = page;
    ctx.feed = followerFeed;
    return {
      __typename: 'UserFollowersList',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(page.ids) ?? '',
        endCursor: _.last(page.ids) ?? '',
        hasPreviousPage: hasPreviousPage,
        hasNextPage: hasNextPage,
      },
    };
  }

  // Followings List
  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getFollowingsList(
    @Args('input') input: GetFollowingsListInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetFollowingsListOutput> {
    const logTag = {
      currentUser: currentUser?.id ?? '<none>',
      userId: input.userId,
    };
    try {
      const user = await this.findUserById(input.userId, currentUser);
      if (!user) {
        this.logger.error('User not found, cannot get following list', {
          ...logTag,
        });
        return this.smartError('User not found');
      }
      const isCurrentUserRequestingTheirDetails =
        currentUser?.id === input.userId;
      if (
        user.visibilityPreferences?.list.following ===
          UserListVisibility.NONE &&
        !isCurrentUserRequestingTheirDetails
      ) {
        this.logger.info('Ignoring following list', {});
        return this.smartError('User has hidden their following list');
      }
      ctx.user = user;
      return {
        __typename: 'GetFollowingsListResult',
        user: this.userService.toUserObject({
          user,
          isCurrentUserRequestingTheirDetails,
        }),
      };
    } catch (e) {
      this.logger.error('Error while getting user following list: ', {
        ...logTag,
        e,
      });
      return this.smartError();
    }
  }

  @ResolveField(() => UserFollowingsList, { name: 'followingsList' })
  async followingsList(
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('before') before: string,
    @Context() ctx: AppContext,
    @Args('last') last?: number,
    @Context('user') user?: UserEntity,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UserFollowingsList | undefined> {
    this.logger.info('followingsList()', {});
    if (!user) {
      return undefined;
    }
    if (currentUser && user) {
      const hasBlockedFromEitherSide: boolean =
        await this.userService.hasBlockedFromEitherSide({
          userA: currentUser,
          userB: user,
        });
      if (hasBlockedFromEitherSide) {
        this.logger.info('followingsList() hasBlockedFromEitherSide');
        return undefined;
      }
    }
    const followingFeedId = user.followingFeedId ?? '';
    const logTag = { currentUser: user.id, feed: followingFeedId };
    const followingFeed = await this.feedService.find(followingFeedId);
    if (!followingFeed) {
      this.logger.error('No follower feed found for user', {
        ...logTag,
        user: user.id,
      });
      return undefined;
    }
    const [page, hasPreviousPage, hasNextPage] =
      (await this.feedService.getPage({
        feedOrId: followingFeed,
        first,
        after,
        last,
        before,
      })) ?? [[], false, false];
    followingFeed.page = page;
    ctx.feed = followingFeed;
    const users: UserEntity[] = await this.userService.findAllById(
      followingFeed.page.ids
    );
    const entries: User[] = users
      .map(user => this.userService.toUserObject({ user }))
      .filter((user): user is User => user !== undefined);
    const edges: UserFollowingsEdge[] =
      entries?.map(entry => ({
        __typename: 'UserFollowingsEdge',
        node: entry,
        cursor: entry.id,
      })) ?? [];
    return {
      __typename: 'UserFollowingsList',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(page.ids) ?? '',
        endCursor: _.last(page.ids) ?? '',
        hasPreviousPage: hasPreviousPage,
        hasNextPage: hasNextPage,
      },
      edges,
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  async blockUser(
    @Args('input') input: BlockUserInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<BlockUserOutput> {
    if (currentUser) {
      const statusOrErrorMessage = await this.userService.blockUser(
        currentUser,
        input.userId!
      );
      if (typeof statusOrErrorMessage === 'string') {
        return {
          __typename: 'SmartError',
          message: statusOrErrorMessage,
        };
      }
      return {
        __typename: 'BlockUserResult',
        isSuccessful: statusOrErrorMessage,
      };
    }
    return this.smartError();
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async unblockUser(
    @Args('input') input: UnblockUserInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UnblockUserOutput> {
    if (currentUser) {
      const statusOrErrorMessage = await this.userService.unblockUser(
        input.userId!,
        currentUser
      );
      if (typeof statusOrErrorMessage === 'string') {
        return {
          __typename: 'SmartError',
          message: statusOrErrorMessage,
        };
      }
      return {
        __typename: 'UnblockUserResult',
        isSuccessful: statusOrErrorMessage,
      };
    }
    return this.smartError();
  }

  @Query()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async checkPhoneNumberAccountExists(
    @Args('input') args: PhoneNumberAccountExistInput
  ): Promise<PhoneNumberUserExistsOutput> {
    this.logger.debug('PhoneNumber', args.phoneNumber);
    return {
      __typename: 'PhoneNumberAccountExistResult',
      phoneNumberAccountExist:
        await this.userService.checkPhoneNumberUserExists(args.phoneNumber!),
    };
  }

  @Query()
  @UseGuards(FirebaseAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async sendEmailVerificationLink(
    @CurrentEmail() email?: string | undefined
  ): Promise<SendEmailVerificationOutput> {
    if (!email) {
      this.logger.error('Email was null', {});
      return {
        __typename: 'SmartError',
        message: 'No email found',
      };
    }
    try {
      const link = await this.firebaseAuthService.generateFirebaseLink(email);
      if (!link) {
        this.logger.error('Unable to generate firebase link');
        return {
          __typename: 'SmartError',
          message: 'Oops! Something went wrong. Please try again.',
        };
      }
      this.logger.debug('Firebase Link Generated', { link });
      await this.mailGunService.sendEmailVerificationEmail(email, link);
      this.logger.debug('Email verification email sent', { email });
      return {
        __typename: 'SendEmailVerificationResult',
        isSuccessful: true,
      };
    } catch (e) {
      return {
        __typename: 'SmartError',
        message: 'Oops! Something went wrong',
      };
    }
  }

  // Block List
  @Query()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getBlockList(
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetBlockListOutput> {
    try {
      if (!currentUser) {
        return this.smartError('User not found');
      }
      ctx.user = currentUser;
      return {
        __typename: 'GetBlockListResult',
        user: this.userService.toUserObject({ user: currentUser }),
      };
    } catch (error) {
      this.logger.error('Error while getting user following list: ', {
        error,
      });
      return this.smartError();
    }
  }

  @ResolveField(() => UserFollowersList, { name: 'blockList' })
  @UseGuards(JwtAuthGuard)
  async blockList(
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<BlockedUsersList | undefined> {
    if (!currentUser) return undefined;
    if (currentUser.id !== (ctx.user?.id ?? '')) return undefined;

    const blockListFeedId = currentUser.blockListFeedId;
    if (!blockListFeedId) {
      this.logger.error('No blockListFeedID found for user', {
        user: currentUser.id,
      });
      return undefined;
    }
    const blockListFeed = await this.feedService.find(blockListFeedId);
    if (!blockListFeed) {
      this.logger.error('No blockListFeed found for user', {
        user: currentUser.id,
      });
      return undefined;
    }
    const [page, hasPreviousPage, hasNextPage] =
      (await this.feedService.getPage({
        feedOrId: blockListFeed,
        first,
        after,
        last,
        before,
      })) ?? [[], false, false];
    blockListFeed.page = page;
    ctx.feed = blockListFeed;
    return {
      __typename: 'BlockedUsersList',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(page.ids) ?? '',
        endCursor: _.last(page.ids) ?? '',
        hasPreviousPage: hasPreviousPage,
        hasNextPage: hasNextPage,
      },
    };
  }

  /// Login/Signup
  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getOrDeleteFirebaseUser(
    @Args() args: GetOrDeleteFirebaseUserArgs,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<GetOrDeleteFirebaseUserOutput> {
    this.logger.debug(
      `deleteFirebaseUser() TempUID = ${currentUid} and args UID = ${args.uid}`
    );
    const user = await this.userService.findByFirebaseUid(args.uid);
    if (!user) {
      this.logger.debug(
        'deleteFirebaseUser() USER NOT FOUND, so deleting user form firebase ',
        {
          id: args.uid,
        }
      );
      const status: boolean = await this.firebaseAuthService.removeUser(
        args.uid
      );
      return {
        __typename: 'DeleteFirebaseUserResult',
        isSuccessful: status,
      };
    } else {
      return {
        __typename: 'SignUpOutput',
        jwtToken: this.userService.getJwtTokenFromUserId(user.id),
        user: this.userService.toUserObject({
          user,
          isCurrentUserRequestingTheirDetails: true,
        }),
      };
    }
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async firebaseSignup(
    // Can't use ts here due to class transformation failure cause by image
    // stream in payload.
    // @ts-ignore
    @Args('input', { type: () => FirebaseSignupInput }) input
  ): Promise<FirebaseSignupOutput> {
    const userWithHandle = await this.userService.findByHandle(input.handle);
    if (userWithHandle) {
      return {
        __typename: 'HandleAlreadyTakenError',
        message: 'Handle already in use',
      };
    }
    const resultOrError: UserLoginResult | boolean =
      await this.userService.firebaseSignup(input);
    if (resultOrError === false) return this.smartError('Something went wrong');
    const { jwtToken, user }: UserLoginResult =
      resultOrError as UserLoginResult;
    if (!jwtToken || !user) {
      this.logger.error(
        'firebaseSignupError error, no jwt token or user found/ No handle or username',
        {
          uid: input.uid,
        }
      );
      return {
        __typename: 'AskForHandleAndNameError',
        message:
          'Something went wrong please re-enter your handle and other details',
      };
    }
    return {
      __typename: 'SignUpOutput',
      jwtToken: jwtToken,
      user: this.userService.toUserObject({
        user,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  // @UseGuards(GoogleAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async firebaseEmailAuthentication(
    @Args('input') args: FirebaseAuthEmailInput,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<FirebaseAuthOutput> {
    const { jwtToken, user } =
      (await this.userService.firebaseLoginOrSignupViaEmailOrPhoneNumber(
        args
      )) ?? {};
    if (!jwtToken || !user) {
      this.logger.error(
        'firebaseEmailAuthentication error, no jwt token or user found/ No handle or username',
        {
          uid: args.uid,
        }
      );
      if (args.canSignup ?? true)
        return {
          __typename: 'AskForHandleAndNameError',
          message:
            'Something went wrong please re-enter your handle and other details',
        };
      else
        return {
          __typename: 'SmartError',
          message:
            'Either the account does not exist or previous signup attempt was incomplete.',
        };
    }
    return {
      __typename: 'LoginOutput',
      jwtToken: jwtToken,
      user: this.userService.toUserObject({
        user,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async firebasePhoneNumberAuthentication(
    @Args('input') args: FirebaseAuthPhoneNumberInput
  ): Promise<FirebaseAuthOutput> {
    const { jwtToken, user } =
      (await this.userService.firebaseLoginOrSignupViaEmailOrPhoneNumber(
        args
      )) ?? {};
    if (!jwtToken || !user) {
      this.logger.error(
        'firebasePhoneNumberAuthentication error, no jwt token or user found/ No handle or username',
        {
          uid: args.uid,
        }
      );
      if (args.canSignup ?? true)
        return {
          __typename: 'AskForHandleAndNameError',
          message:
            'Something went wrong please re-enter your handle and other details',
        };
      else
        return {
          __typename: 'SmartError',
          message:
            'Either the account does not exist or previous signup attempt was incomplete.',
        };
    }
    return {
      __typename: 'LoginOutput',
      jwtToken: jwtToken,
      user: this.userService.toUserObject({
        user,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateEmail(
    @Args('input') args: UpdateEmailInput,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<UpdateEmailOutput> {
    if (!currentUid) {
      return {
        __typename: 'SmartError',
        message: 'Sorry, user not found.',
      };
    }
    const userOrMessage = await this.userService.updateEmail(
      currentUid,
      args.email
    );
    if (typeof userOrMessage === 'string')
      return {
        __typename: 'SmartError',
        message: userOrMessage,
      };

    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateName(
    @Args('input') args: UpdateNameInput,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<UpdateNameOutput> {
    if (!currentUid) {
      return {
        __typename: 'SmartError',
        message: 'Sorry, user not found.',
      };
    }
    const userOrMessage: UserEntity | string =
      await this.userService.updateName(currentUid, args.name);

    if (typeof userOrMessage === 'string')
      return this.smartError(userOrMessage as unknown as string);

    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateHandle(
    @Args('input') args: UpdateHandleInput,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<UpdateHandleOutput> {
    if (!currentUid) return this.smartError('Sorry, user not found.');

    const userOrMessage = await this.userService.updateHandle(
      currentUid,
      args.handle
    );

    if (typeof userOrMessage === 'string')
      return this.smartError(userOrMessage);

    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updatePhoneNumber(
    @Args('input') args: UpdatePhoneNumberInput,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<UpdatePhoneNumberOutput> {
    if (!currentUid) return this.smartError('Sorry, user not found.');

    const userOrMessage = await this.userService.updatePhoneNumber(
      currentUid,
      args.phoneNumber
    );

    if (typeof userOrMessage === 'string')
      return this.smartError(userOrMessage);
    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateAvatar(
    // ❌ @Args('input') args: UpdateUserAvatarInput, ❌
    // ‼️ Do not add typescript type for `input`, issues with graphql-upload type
    // @ts-ignore
    @Args('input', { type: () => UpdateUserAvatarInput })
    input,
    @CurrentUID()
    currentUid?: string | undefined
  ): Promise<UpdateUserAvatarOutput> {
    if (!currentUid) return this.smartError('Sorry, user not found.');

    const userOrMessage = await this.userService.updateAvatar(
      currentUid,
      input.image
    );

    if (typeof userOrMessage === 'string')
      return this.smartError(userOrMessage);
    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async removeAvatar(
    shouldRemove: boolean,
    @CurrentUID()
    currentUid?: string | undefined
  ): Promise<UpdateUserAvatarOutput> {
    if (!currentUid) return this.smartError('Sorry, user not found.');
    const userOrMessage = await this.userService.removeAvatar(currentUid);
    if (typeof userOrMessage === 'string')
      return this.smartError(userOrMessage);
    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updatePronoun(
    @Args('input') args: UpdatePronounInput,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<UpdatePronounOutput> {
    if (!currentUid) return this.smartError('Sorry, user not found.');
    const userOrMessage = await this.userService.updatePronoun(
      currentUid,
      args.pronoun
    );

    if (typeof userOrMessage === 'string')
      return this.smartError(userOrMessage);

    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(FirebaseAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateBio(
    @Args('input') args: UpdateBioInput,
    @CurrentUID() currentUid?: string | undefined
  ): Promise<UpdateBioOutput> {
    if (!currentUid) return this.smartError('Sorry, user not found.');

    const userOrMessage = await this.userService.updateBio(
      currentUid,
      args.bio
    );

    if (typeof userOrMessage === 'string')
      return this.smartError(userOrMessage);
    return {
      __typename: 'UpdatedUserResult',
      updatedUser: this.userService.toUserObject({
        user: userOrMessage,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  // @UseGuards(FirebaseAuthGuard)
  async updateFCMToken(
    @Args('input', { type: () => UpdateFCMTokenInput })
    args: UpdateFCMTokenInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UpdateFCMTokenOutput> {
    let errorMessage: string | undefined = undefined;
    if (currentUser) {
      const userOrErrorMessage = await this.userService.updateFCMTokenn(
        currentUser.id,
        args.token ?? ''
      );
      if (typeof userOrErrorMessage === 'string') {
        errorMessage = userOrErrorMessage;
      }
    } else {
      errorMessage = 'User not found';
    }
    if (errorMessage) {
      return this.smartError(errorMessage);
    } else
      return {
        __typename: 'UpdateFCMTokenStatus',
        success: true,
      };
  }

  @Mutation()
  @UseGuards(GqlAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async login(@Args() args: LoginArgs): Promise<LoginOutput | undefined> {
    const { jwtToken, user } =
      (await this.userService.login(args.username, args.fcmToken ?? '')) ?? {};
    if (!jwtToken || !user) {
      this.logger.error('error while logging user, user not found', {
        userName: args.username,
      });
      return undefined;
    }
    this.logger.debug('login returning user', {
      firebaseUID: user.firebaseUID,
      handle: user.handle,
    });
    return {
      __typename: 'LoginOutput',
      jwtToken: jwtToken,
      user: this.userService.toUserObject({
        user,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Mutation()
  @WildrSpan()
  @UseGuards(SignupFirebaseJwtAuthGuard)
  async signUpWithEmail(
    @Args('input') input: SignUpWithEmailInput,
    @CurrentIdToken() idToken: DecodedIdToken
  ): Promise<SignUpOutput | undefined> {
    if (!process.env.DANGEROUSLY_ALLOW_INSECURE_SIGNUP) return;
    const user = await this.userService.signUp({
      input,
      idToken,
    });
    if (!user) return;
    this.logger.debug('signUpWithEmail user:', { user: user.id });
    const res = await this.userService.login(input.email, input.fcmToken ?? '');
    // TODO: Fix return type to error type
    if (!res) return { user: { id: '' }, jwtToken: '' };
    return {
      __typename: 'SignUpOutput',
      user: this.userService.toUserObject({
        user,
        isCurrentUserRequestingTheirDetails: true,
      }),
      jwtToken: res.jwtToken,
    };
  }

  @Mutation()
  @WildrSpan()
  @UseGuards(SignupFirebaseJwtAuthGuard)
  async signUpWithPhoneNumber(
    @Args('input') input: SignUpWithPhoneNumberInput,
    @CurrentIdToken() idToken: DecodedIdToken
  ): Promise<SignUpOutput> {
    if (!idToken) {
      this.logger.warn('phone number signup attempt with bad firebase token');
      return {
        __typename: 'SignUpOutput',
        user: undefined,
      };
    }
    const user = await this.userService.signUp({
      input,
      idToken,
    });
    if (!user) {
      return {
        __typename: 'SignUpOutput',
        user: undefined,
      };
    }
    return {
      __typename: 'SignUpOutput',
      user: this.userService.toUserObject({
        user,
        isCurrentUserRequestingTheirDetails: true,
      }),
    };
  }

  @Query()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async checkEmail(@Args() args: CheckEmailArgs): Promise<CheckEmailOutput> {
    const result = await this.userService.findByEmail(args.email);
    return {
      __typename: 'CheckEmailResult',
      doesExist: result !== undefined,
    };
  }

  @Query()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async checkHandle(@Args() args: CheckHandleArgs): Promise<CheckHandleOutput> {
    const result = await this.userService.findByHandle(args.handle);
    return {
      __typename: 'CheckHandleResult',
      doesExist: result !== undefined,
    };
  }

  @Query()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async check3rdParty(
    @Args() args: Check3rdPartyArgs
  ): Promise<Check3rdPartyOutput> {
    const result = await this.firebaseAuthService.findUserBy3rdPartyUid(
      args.providerId,
      args.uid
    );
    return {
      __typename: 'Check3rdPartyResult',
      doesExist: result !== undefined,
    };
  }

  @Query()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getDetailsFrom3rdPartyUid(
    @Args() args: Check3rdPartyArgs
  ): Promise<Get3rdPartyDetailsOutput> {
    const result = await this.firebaseAuthService.findUserBy3rdPartyUid(
      args.providerId,
      args.uid
    );
    return {
      __typename: 'Get3rdPartyDetailsResult',
      name:
        result?.displayName !== 'null null' ? result?.displayName : undefined,
      email: result?.email,
    };
  }

  //Helper
  smartError(message = 'Something went wrong'): SmartError {
    return {
      __typename: 'SmartError',
      message,
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateCommentEmbargoOnboardingAt(
    @CurrentUser() currentUser: UserEntity
  ): Promise<CommentEmbargoOnboardingLiftedOutput> {
    try {
      const user = await this.userService.updateCommentOnboardAt(
        currentUser.id
      );
      if (user) {
        return {
          __typename: 'CommentEmbargoOnboardingLiftedResult',
          lifted: true,
        };
      } else {
        return this.smartError('Error lifting comment embargo');
      }
    } catch (error) {
      this.logger.error('Error while removing follower: ', { error });
    }
    return this.smartError('Error lifting comment embargo');
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async requestDeleteUser(
    @CurrentUser() currentUser: UserEntity
  ): Promise<RequestDeleteUserOutput> {
    try {
      const user = await this.userService.requestDeleteUser(currentUser);
      if (user) {
        return {
          __typename: 'RequestDeleteUserResult',
          deleteRequestAccepted: true,
        };
      } else {
        return this.smartError('Error requesting delete');
      }
    } catch (error) {
      this.logger.error('Error while user request to delete: ', { error });
    }
    return this.smartError('Error requesting delete');
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async reportUser(
    @Args('input', { type: () => ReportUserInput })
    input: ReportUserInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ReportUserOutput> {
    try {
      const reportedUserOrErrorMessage: UserEntity | string =
        await this.userService.report(input.userId, input.type, currentUser);
      if (isString(reportedUserOrErrorMessage)) {
        this.logger.error('User for reporting: ', {
          errorMessage: reportedUserOrErrorMessage,
        });
        return {
          __typename: 'SmartError',
          message: reportedUserOrErrorMessage,
        };
      }
      return {
        __typename: 'ReportUserResult',
        user: this.userService.toUserObject({
          user: reportedUserOrErrorMessage,
        }),
      };
    } catch (e) {
      this.logger.error('Error while reporting a post: ', e);
      throw e;
    }
  }

  @Query()
  @UseGuards(JwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getInviteCode(
    @Args('input', { type: () => GetInviteCodeInput })
    input: GetInviteCodeInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetInviteCodeOutput> {
    if (!currentUser) {
      this.logger.error('[getInviteCode()], currentUser is null');
      return {
        __typename: 'SmartError',
        message: "Couldn't fetch details, please try again later",
      };
    }
    const [inviteCode, user, message] = await this.userService.getInviteCode(
      currentUser.id,
      input.action ?? undefined
    );
    if (message) {
      return {
        __typename: 'SmartError',
        message,
      };
    }
    return {
      __typename: 'GetInviteCodeResult',
      user,
      code: inviteCode!.code,
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async wildrVerifiedManualReview(
    @Args('input', { type: () => GqnGqlWildrVerifiedManualReviewInput })
    input: WildrVerifiedManualReviewInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<WildrVerifiedManualReviewOutput> {
    await this.userService.wildrVerifiedManualReviewSubmission(
      input,
      currentUser
    );
    return {
      __typename: 'WildrVerifiedManualReviewResult',
      message:
        'Please wait for your account to be reviewed, but you can start commenting',
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateRealIdStatus(
    @Args('input', { type: () => GenGqlUpdateRealIdVerificationInput })
    input: GqlUpdateRealIdVerificationInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<UpdateRealIdVerificationOutput> {
    try {
      if (
        input.passFailState === PassFailState.FAIL &&
        !input.realIdFailedVerificationImageData
      ) {
        return {
          __typename: 'SmartError',
          message: 'Please provide failed real id images',
        };
      }
      if (input.faceData.faceSignature.length !== 192) {
        return {
          __typename: 'SmartError',
          message: 'Your real id face was invalid',
        };
      }
      const [isSuccessful, message] = await this.userService.updateRealIdStatus(
        currentUser!,
        getPassFailState(input.passFailState.valueOf()), //converting string enum to numbered enum
        input.faceImage,
        { ...input.faceData },
        input.realIdFailedVerificationImageData
      );
      if (isSuccessful) {
        return {
          __typename: 'UpdateRealIdVerificationResult',
          message: message,
        };
      } else {
        return {
          __typename: 'SmartError',
          message: message,
        };
      }
    } catch (e) {
      this.logger.error('Error updating real id status', { e });
      return {
        __typename: 'SmartError',
        message: 'Error updating real id status',
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateCategoryInterests(
    @Args('input', { type: () => UpdateCategoryInterestsInput })
    input: UpdateCategoryInterestsInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UpdateCategoryInterestsOutput> {
    try {
      if (!currentUser) {
        this.logger.error(
          'Error finding current user on updateCategoryInterests'
        );
        return {
          __typename: 'SmartError',
          message: 'Something went wrong',
        };
      }
      await this.userService.updateCategoryInterests(
        currentUser.id,
        input.categoryIds
      );
      return {
        __typename: 'UpdateCategoryInterestsResult',
        success: true,
      };
    } catch (e) {
      this.logger.error(e);
      return {
        __typename: 'SmartError',
        message: 'Something went wrong, please try again.',
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updatePostTypeInterests(
    @Args('input', { type: () => UpdatePostTypeInterestsInput })
    input: UpdatePostTypeInterestsInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UpdatePostTypeInterestsOutput> {
    try {
      if (!currentUser) {
        this.logger.error(
          'Error finding current user on updateCategoryInterests'
        );
        return {
          __typename: 'SmartError',
          message: 'Something went wrong',
        };
      }
      await this.userService.updatePostTypeInterests(
        currentUser.id,
        input.postTypes
      );
      delay(() => {
        this.userService.prepareInitialFeed(currentUser.id);
      }, 2000);
      return {
        __typename: 'UpdatePostTypeInterestsResult',
        success: true,
      };
    } catch (e) {
      this.logger.error(e);
      return {
        __typename: 'SmartError',
        message: 'Something went wrong, please try again.',
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateLastSeenCursor(
    @Args('input', { type: () => UpdateLastSeenCursorInput })
    input: UpdateLastSeenCursorInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UpdateLastSeenCursorOutput> {
    let isSuccessful = false;
    try {
      if (currentUser) {
        if (
          currentUser.exploreFeedUpdatedAt /*  &&
         currentUser.lastSeenCursorPersonalizedFeed */
        ) {
          const type = input.feedType;
          const scope = input.scopeType ?? FeedScopeType.GLOBAL;
          if (type === FeedType.ALL && scope === FeedScopeType.PERSONALIZED) {
            if (input.isRefresh) {
              currentUser.exploreFeedRefreshedAt = new Date(
                Number(input.timestamp)
              );
              await this.userService.save(currentUser);
            }
            if (scope === FeedScopeType.PERSONALIZED) {
              if (
                currentUser.exploreFeedUpdatedAt &&
                currentUser.exploreFeedRefreshedAt
              ) {
                if (
                  currentUser.exploreFeedUpdatedAt >
                  currentUser.exploreFeedRefreshedAt
                ) {
                  this.logger.info(
                    'Not updating lastSeenCursor, ' +
                      ' make the user paginate from the new cursor position.'
                  );
                  /* Do not update lastSeenCursor,
                   * we'll make the user paginate from the new cursor position.
                   */
                  return {
                    __typename: 'UpdateLastSeenCursorOutput',
                    isSuccessful: true,
                  };
                }
              }
              await this.userService.update(currentUser.id, {
                lastSeenCursorPersonalizedFeed: input.endCursor,
              });
              this.logger.info('updating lastSeenCursorPersonalizedFeed');
              isSuccessful = true;
            }
          }
        } else {
          this.logger.info(
            'updateLastSeenCursor() user does not have any' + ' explore feed'
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
      return {
        __typename: 'UpdateLastSeenCursorOutput',
        isSuccessful: false,
      };
    }
    return {
      __typename: 'UpdateLastSeenCursorOutput',
      isSuccessful,
    };
  }

  @ResolveField()
  @UseGuards(JwtAuthGuard)
  async onboardingStats(
    @Parent() user: User,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<OnboardingStats | undefined> {
    if (!currentUser) return;
    if (user.id !== currentUser.id) return;
    const stats = await this.userService.getOnboardingStats(currentUser);
    return {
      __typename: 'OnboardingStats',
      ...stats,
    };
  }

  @ResolveField()
  @UseGuards(JwtAuthGuard)
  async invitesConnection(
    @Args('input') input: InvitesConnectionInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<InvitesConnection | undefined> {
    const context = {
      userId: currentUser?.id,
      paginationInput: input.paginationInput,
      methodName: UserResolver.prototype.invitesConnection.name,
    };
    if (!currentUser) {
      this.logger.warn('missing user in invites connection request', context);
      return;
    }
    const invitedUsers = await this.inviteListService.paginateInvites({
      currentUser,
      paginationInput: input.paginationInput,
    });
    if (invitedUsers.isErr()) {
      this.logger.error('error getting invited users', {
        error: invitedUsers.error,
        ...context,
      });
      return;
    }
    const edgeResults = invitedUsers.value.items.map(user =>
      this.inviteListTransporter.toGqlInviteEdge({ user })
    );
    const edges: InviteEdge[] = [];
    for (const edgeResult of edgeResults) {
      if (edgeResult.isErr()) {
        this.logger.error('error getting invite edge', {
          error: edgeResult.error,
          ...context,
        });
        return;
      }
      edges.push(edgeResult.value);
    }
    return {
      __typename: 'InvitesConnection',
      edges,
      pageInfo: {
        __typename: 'PageInfo',
        ...invitedUsers.value.pageInfo,
      },
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async skipOnboarding(
    @Args('input', { type: () => UpdateOnboardingInput })
    input: UpdateOnboardingInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<OnboardingUpdateOutput> {
    await this.userService.skipOnboarding(input, currentUser);
    const stats = await this.userService.getOnboardingStats(currentUser);
    return {
      __typename: 'OnboardingStats',
      ...stats,
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async finishOnboarding(
    @Args('input', { type: () => UpdateOnboardingInput })
    input: UpdateOnboardingInput,
    @CurrentUser() currentUser: UserEntity
  ): Promise<OnboardingUpdateOutput> {
    await this.userService.finishOnboarding(input, currentUser);
    const stats = await this.userService.getOnboardingStats(currentUser);
    return {
      __typename: 'OnboardingStats',
      ...stats,
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  async updateListVisibility(
    @Args('input', { type: () => GqlUpdateListVisibilityInput })
    input: GqlUpdateListVisibilityInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GqlUpdateListVisibilityOutput> {
    try {
      if (!currentUser) {
        this.logger.error('Error finding current user on updateListVisibility');
        return {
          __typename: 'SmartError',
          message: 'Something went wrong',
        };
      }
      const user = await this.userService.updateListVisibility(
        {
          following: toUserListVisibility(input.following),
          follower: toUserListVisibility(input.follower),
        },
        currentUser
      );
      return {
        __typename: 'UpdateListVisibilityResult',
        isSuccessful: true,
        user: this.userService.toUserObject({
          user,
          isCurrentUserRequestingTheirDetails: true,
        }),
      };
    } catch (e) {
      this.logger.error('Error updating list visibility', { e });
      return {
        __typename: 'SmartError',
        message: 'Error updating list visibility',
      };
    }
  }

  @Query()
  @UseGuards(FirebaseAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  private async isEmailVerified(
    @CurrentUID() uid?: string
  ): Promise<IsEmailVerifiedOutput> {
    try {
      if (!uid) {
        return somethingWentWrongSmartError;
      }
      const result = await this.firebaseAuthService.isEmailVerified(uid);
      return {
        __typename: 'IsEmailVerifiedResult',
        isEmailVerified: result,
      };
    } catch (e) {
      return somethingWentWrongSmartError;
    }
  }

  // Helpers
  private async findUserById(id: string, currentUser?: UserEntity) {
    return id === currentUser?.id
      ? currentUser
      : await this.userService.findById(id);
  }
}
