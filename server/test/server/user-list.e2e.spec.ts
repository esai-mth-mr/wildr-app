import { INestApplication } from '@nestjs/common';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection, Repository } from 'typeorm';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import supertest from 'supertest';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import {
  AddMemberToInnerCircleInput,
  RemoveMemberFromInnerCircleInput,
} from '@verdzie/server/generated-graphql';
import { getJWT } from '@verdzie/test/utils/auth';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { UserListResolverModule } from '@verdzie/server/user-list-resolver/userListResolver.module';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserListEntityFake } from '@verdzie/server/user-list/testing/userList.entity.fake';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { UserPropertyMapEntity } from '@verdzie/server/user-property-map/userPropertyMap.entity';
import { getUserPropertyMapId } from '@verdzie/server/user-property-map/userPropertyMap.helpers';
import { kInnerCircleListId } from '../../constants';
import { UserPropertyMapEntityFake } from '@verdzie/server/user-property-map/testing/userPropertyMapEntity.fake';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('UserList', () => {
  let app: INestApplication;
  let conn: Connection;
  let feedRepo: Repository<FeedEntity>;
  let userRepo: Repository<UserEntity>;
  let userListRepo: Repository<UserListEntity>;
  let userPropertyMapRepo: Repository<UserPropertyMapEntity>;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        GraphQLWithUploadModule.forRoot(),
        WildrBullModule,
        AuthModule,
        UserListModule,
        UserListResolverModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    feedRepo = conn.getRepository(FeedEntity);
    userRepo = conn.getRepository(UserEntity);
    userListRepo = conn.getRepository(UserListEntity);
    userPropertyMapRepo = conn.getRepository(UserPropertyMapEntity);
    await conn.synchronize(true);
    await app.init();
  });

  beforeEach(async () => {
    await userRepo.delete({});
    await userListRepo.delete({});
    await feedRepo.delete({});
    await userPropertyMapRepo.delete({});
  });

  afterAll(async () => {
    await userRepo.delete({});
    await userListRepo.delete({});
    await feedRepo.delete({});
    await userPropertyMapRepo.delete({});
    await app.close();
    await conn.close();
  });

  describe('addMemberToInnerCircle', () => {
    const addMemberToInnerCircleMutation = /* GraphQL */ `
      mutation AddMemberToInnerCircle($input: AddMemberToInnerCircleInput!) {
        addMemberToInnerCircle(input: $input) {
          ... on UpdateListResult {
            owner {
              id
              stats {
                innerCircleCount
              }
            }
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    it('should return an error if the user is not following the user', async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [] }),
      });
      await feedRepo.insert([currentUserFollowingFeed]);
      await userRepo.insert([currentUser]);
      const input: AddMemberToInnerCircleInput = {
        memberId: 'otherUserId',
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: addMemberToInnerCircleMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          addMemberToInnerCircle: {
            __typename: 'SmartError',
            message: 'You need to follow this user first',
          },
        },
      });
    });

    it('should return an error if the current user does not exist', async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [] }),
      });
      await feedRepo.insert([currentUserFollowingFeed]);
      const input: AddMemberToInnerCircleInput = {
        memberId: 'otherUserId',
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: addMemberToInnerCircleMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          addMemberToInnerCircle: {
            __typename: 'SmartError',
            message: 'Oops! Something went wrong',
          },
        },
      });
    });

    it('should return a user with updated inner circle stats', async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const followedUser = UserEntityFake();
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [followedUser.id] }),
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
      });
      await feedRepo.insert([
        currentUserFollowingFeed,
        currentUserInnerCircleSuggestionsFeed,
      ]);
      await userListRepo.insert([currentUserInnerCircleList]);
      await userRepo.insert([currentUser, followedUser]);
      const input: AddMemberToInnerCircleInput = {
        memberId: followedUser.id,
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: addMemberToInnerCircleMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          addMemberToInnerCircle: {
            owner: {
              id: currentUser.id,
              stats: {
                innerCircleCount: 1,
              },
            },
          },
        },
      });
    });

    it(`should update the user's inner circe stats`, async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const followedUser = UserEntityFake();
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [followedUser.id] }),
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
      });
      await feedRepo.insert([
        currentUserFollowingFeed,
        currentUserInnerCircleSuggestionsFeed,
      ]);
      await userListRepo.insert([currentUserInnerCircleList]);
      await userRepo.insert([currentUser, followedUser]);
      const input: AddMemberToInnerCircleInput = {
        memberId: followedUser.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: addMemberToInnerCircleMutation,
          variables: { input },
        });
      const updatedUser = await userRepo.findOneOrFail(currentUser.id);
      expect(updatedUser._stats?.innerCircleCount).toEqual(1);
    });

    it('should add the user to the currentUsers inner circle list', async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const followedUser = UserEntityFake();
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [followedUser.id] }),
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
      });
      await feedRepo.insert([
        currentUserFollowingFeed,
        currentUserInnerCircleSuggestionsFeed,
      ]);
      await userListRepo.insert([currentUserInnerCircleList]);
      await userRepo.insert([currentUser, followedUser]);
      const input: AddMemberToInnerCircleInput = {
        memberId: followedUser.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: addMemberToInnerCircleMutation,
          variables: { input },
        });
      const updatedInnerCircleList = await userListRepo.findOneOrFail(
        innerCircleListId(currentUser.id)
      );
      expect(updatedInnerCircleList.ids).toEqual([followedUser.id]);
      expect(updatedInnerCircleList.metaData?.memberCount).toEqual(1);
    });

    it('should add followed user to followedUser property map', async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const followedUser = UserEntityFake();
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [followedUser.id] }),
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
      });
      await feedRepo.insert([
        currentUserFollowingFeed,
        currentUserInnerCircleSuggestionsFeed,
      ]);
      await userListRepo.insert([currentUserInnerCircleList]);
      await userRepo.insert([currentUser, followedUser]);
      const input: AddMemberToInnerCircleInput = {
        memberId: followedUser.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: addMemberToInnerCircleMutation,
          variables: { input },
        });
      const updatedUserPropertyMap = await userPropertyMapRepo.findOneOrFail(
        getUserPropertyMapId({ userId: followedUser.id })
      );
      expect(updatedUserPropertyMap?.userPropertyKvP?.[currentUser.id]).toEqual(
        [currentUser.id + '#' + kInnerCircleListId]
      );
    });

    it('should remove the added user from the currentUsers inner circle suggestions', async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const followedUser = UserEntityFake();
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [followedUser.id] }),
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [followedUser.id] }),
      });
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
      });
      await feedRepo.insert([
        currentUserFollowingFeed,
        currentUserInnerCircleSuggestionsFeed,
      ]);
      await userListRepo.insert([currentUserInnerCircleList]);
      await userRepo.insert([currentUser, followedUser]);
      const input: AddMemberToInnerCircleInput = {
        memberId: followedUser.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: addMemberToInnerCircleMutation,
          variables: { input },
        });
      const updatedInnerCircleSuggestions = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST, currentUser.id)
      );
      expect(updatedInnerCircleSuggestions.page.ids).toEqual([]);
    });

    // TODO test background jobs
  });

  describe('removeMemberFromInnerCircle', () => {
    const removeMemberFromInnerCircleMutation = /* GraphQL */ `
      mutation RemoveMemberFromInnerCircle(
        $input: RemoveMemberFromInnerCircleInput!
      ) {
        removeMemberFromInnerCircle(input: $input) {
          ... on UpdateListResult {
            owner {
              id
              stats {
                innerCircleCount
              }
            }
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    it('should return an error if the currentUser does not exist', async () => {
      const currentUser = UserEntityFake();
      const input: RemoveMemberFromInnerCircleInput = {
        memberId: 'otherUserId',
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: removeMemberFromInnerCircleMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          removeMemberFromInnerCircle: {
            __typename: 'SmartError',
            message: 'Oops! Something went wrong',
          },
        },
      });
    });

    it('should return a user with updated inner circle stats', async () => {
      const currentUser = UserEntityFake();
      // @ts-ignore
      currentUser._stats?.innerCircleCount = 1;
      const followedUser = UserEntityFake();
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
        ids: [followedUser.id],
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      await userListRepo.insert([currentUserInnerCircleList]);
      await feedRepo.insert([currentUserInnerCircleSuggestionsFeed]);
      await userRepo.insert([currentUser, followedUser]);
      const input: RemoveMemberFromInnerCircleInput = {
        memberId: followedUser.id,
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: removeMemberFromInnerCircleMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          removeMemberFromInnerCircle: {
            owner: {
              id: currentUser.id,
              stats: {
                innerCircleCount: 0,
              },
            },
          },
        },
      });
    });

    it('should update the users inner circle stats', async () => {
      const currentUser = UserEntityFake();
      // @ts-ignore
      currentUser._stats?.innerCircleCount = 1;
      const followedUser = UserEntityFake();
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
        ids: [followedUser.id],
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      await userListRepo.insert([currentUserInnerCircleList]);
      await feedRepo.insert([currentUserInnerCircleSuggestionsFeed]);
      await userRepo.insert([currentUser, followedUser]);
      const input: RemoveMemberFromInnerCircleInput = {
        memberId: followedUser.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: removeMemberFromInnerCircleMutation,
          variables: { input },
        });
      const updatedUser = await userRepo.findOneOrFail(currentUser.id);
      expect(updatedUser._stats?.innerCircleCount).toEqual(0);
    });

    it('should remove the user from the currentUsers inner circle list', async () => {
      const currentUser = UserEntityFake();
      // @ts-ignore
      currentUser._stats?.innerCircleCount = 1;
      const followedUser = UserEntityFake();
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
        ids: [followedUser.id],
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      await userListRepo.insert([currentUserInnerCircleList]);
      await feedRepo.insert([currentUserInnerCircleSuggestionsFeed]);
      await userRepo.insert([currentUser, followedUser]);
      const input: RemoveMemberFromInnerCircleInput = {
        memberId: followedUser.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: removeMemberFromInnerCircleMutation,
          variables: { input },
        });
      const updatedInnerCircleList = await userListRepo.findOneOrFail(
        innerCircleListId(currentUser.id)
      );
      expect(updatedInnerCircleList.ids).toEqual([]);
      expect(updatedInnerCircleList.metaData?.memberCount).toEqual(0);
    });

    it('should remove the user from currentUsers user property map', async () => {
      const currentUser = UserEntityFake();
      // @ts-ignore
      currentUser._stats.innerCircleCount = 1;
      const followedUser = UserEntityFake();
      const currentUserInnerCircleList = UserListEntityFake({
        id: innerCircleListId(currentUser.id),
        ids: [followedUser.id],
      });
      const currentUserInnerCircleSuggestionsFeed = FeedEntityFake({
        id: toFeedId(
          FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
          currentUser.id
        ),
        page: FeedPageFake({ ids: [] }),
      });
      const followedUserPropertyMap = UserPropertyMapEntityFake(
        getUserPropertyMapId({ userId: followedUser.id })
      );
      followedUserPropertyMap.setOrAppendProperty(currentUser.id, [
        currentUser.id + '#' + kInnerCircleListId,
      ]);
      await userListRepo.insert([currentUserInnerCircleList]);
      await userPropertyMapRepo.insert([followedUserPropertyMap]);
      await feedRepo.insert([currentUserInnerCircleSuggestionsFeed]);
      await userRepo.insert([currentUser, followedUser]);
      const input: RemoveMemberFromInnerCircleInput = {
        memberId: followedUser.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: removeMemberFromInnerCircleMutation,
          variables: { input },
        });
      const updatedUserPropertyMap = await userPropertyMapRepo.findOneOrFail(
        getUserPropertyMapId({ userId: followedUser.id })
      );
      expect(updatedUserPropertyMap?.userPropertyKvP?.[currentUser.id]).toEqual(
        []
      );
    });

    // TODO test background jobs
  });
});
