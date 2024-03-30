import { INestApplication } from '@nestjs/common';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import {
  BlockUserInput,
  FollowUserInput,
  FollowUserResult,
  GetUserInput,
  InviteState,
  InvitesConnection,
  InvitesConnectionInput,
} from '@verdzie/server/generated-graphql';
import { User } from '@verdzie/server/graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserResolverModule } from '@verdzie/server/user/resolvers/userResolver.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserModule } from '@verdzie/server/user/user.module';
import { getJWT } from '@verdzie/test/utils/auth';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import supertest from 'supertest';
import { Connection, Repository } from 'typeorm';

describe('User', () => {
  let app: INestApplication;
  let conn: Connection;
  let feedRepo: Repository<FeedEntity>;
  let userRepo: Repository<UserEntity>;
  let activityStreamRepo: Repository<ActivityStreamEntity>;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        GraphQLWithUploadModule.forRoot(),
        WildrBullModule,
        UserModule,
        UserResolverModule,
        AuthModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    feedRepo = conn.getRepository(FeedEntity);
    userRepo = conn.getRepository(UserEntity);
    activityStreamRepo = conn.getRepository(ActivityStreamEntity);
    await conn.synchronize(true);
    await app.init();
  });

  beforeEach(async () => {
    await userRepo.delete({});
    await feedRepo.delete({});
    await activityStreamRepo.delete({});
  });

  afterAll(async () => {
    await userRepo.delete({});
    await feedRepo.delete({});
    await app.close();
    await conn.close();
  });

  describe('followUser', () => {
    const followUserMutation = /* GraphQL */ `
      mutation followUser($input: FollowUserInput!) {
        followUser(input: $input) {
          ... on FollowUserResult {
            currentUser {
              __typename
              id
              stats {
                __typename
                followingCount
                followerCount
                postCount
              }
              currentUserContext {
                __typename
                followingUser
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

    it('should return if the userToFollow blocked the currentUser', async () => {
      const currentUser = UserEntityFake();
      const userToFollow = UserEntityFake();
      const userToFollowBlockedFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, userToFollow.id),
        page: FeedPageFake({ ids: [currentUser.id] }),
      });
      await feedRepo.insert(userToFollowBlockedFeed);
      await userRepo.insert([currentUser, userToFollow]);
      const input: FollowUserInput = {
        userId: userToFollow.id,
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: followUserMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          followUser: {
            __typename: 'SmartError',
            message: 'Error following user',
          },
        },
      });
    });

    const setupUsersAndFeeds = async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const userToFollow = UserEntityFake();
      userToFollow.followerFeedId = toFeedId(
        FeedEntityType.FOLLOWER,
        userToFollow.id
      );
      // It's ok to assume that these feeds exist as a foreign key constraint
      // prevents the user from being created without them.
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [] }),
      });
      const userToFollowFollowersFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, userToFollow.id),
        page: FeedPageFake({ ids: [] }),
      });
      await feedRepo.insert([
        currentUserFollowingFeed,
        userToFollowFollowersFeed,
      ]);
      await userRepo.insert([currentUser, userToFollow]);
      return { currentUser, userToFollow };
    };

    it('should return a user with updated stats', async () => {
      const { currentUser, userToFollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToFollow.id,
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: followUserMutation,
          variables: { input },
        });
      const expectedResult: FollowUserResult = {
        currentUser: {
          __typename: 'User',
          id: currentUser.id,
          stats: {
            __typename: 'UserStats',
            followingCount: 1,
            followerCount: 0,
            postCount: 0,
          },
          currentUserContext: {
            __typename: 'UserContext',
            followingUser: true,
          },
        },
      };
      expect(response.body).toMatchObject({
        data: {
          followUser: expectedResult,
        },
      });
    });

    it(`should update the currentUser's following feed`, async () => {
      const { currentUser, userToFollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToFollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: followUserMutation,
          variables: { input },
        });
      const currentUserFollowingFeed = await feedRepo.findOneOrFail(
        currentUser.followingFeedId
      );
      expect(currentUserFollowingFeed.page.ids).toContain(userToFollow.id);
    });

    it(`should update the userToFollow's followers feed`, async () => {
      const { currentUser, userToFollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToFollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: followUserMutation,
          variables: { input },
        });
      const userToFollowFollowersFeed = await feedRepo.findOneOrFail(
        userToFollow.followerFeedId
      );
      expect(userToFollowFollowersFeed.page.ids).toContain(currentUser.id);
    });

    it(`should update the currentUser's stats`, async () => {
      const { currentUser, userToFollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToFollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: followUserMutation,
          variables: { input },
        });
      const currentUserUpdated = await userRepo.findOneOrFail(currentUser.id);
      expect(currentUserUpdated?._stats?.followingCount).toBe(1);
    });

    it(`should update the userToFollow's follower count`, async () => {
      const { currentUser, userToFollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToFollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: followUserMutation,
          variables: { input },
        });
      const userToFollowUpdated = await userRepo.findOneOrFail(userToFollow.id);
      expect(userToFollowUpdated?._stats?.followerCount).toBe(1);
    });

    // TODO test background job creation
  });

  describe('unFollow', () => {
    const unFollowMutation = /* GraphQL */ `
      mutation UnFollow($input: UnfollowUserInput!) {
        unfollowUser(input: $input) {
          ... on UnfollowUserResult {
            currentUser {
              id
              stats {
                followingCount
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

    const setupUsersAndFeeds = async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const userToUnfollow = UserEntityFake();
      userToUnfollow.followerFeedId = toFeedId(
        FeedEntityType.FOLLOWER,
        userToUnfollow.id
      );
      // It's ok to assume that these feeds exist as a foreign key constraint
      // prevents the user from being created without them.
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [userToUnfollow.id] }),
      });
      const userToFollowFollowersFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, userToUnfollow.id),
        page: FeedPageFake({ ids: [currentUser.id] }),
      });
      await feedRepo.insert([
        currentUserFollowingFeed,
        userToFollowFollowersFeed,
      ]);
      await userRepo.insert([currentUser, userToUnfollow]);
      return { currentUser, userToUnfollow };
    };

    it('should return a user with updated stats', async () => {
      const { currentUser, userToUnfollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToUnfollow.id,
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: unFollowMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          unfollowUser: {
            currentUser: {
              id: currentUser.id,
              stats: {
                followingCount: 0,
              },
            } as User,
          },
        },
      });
    });

    it(`should update the currentUser's following feed`, async () => {
      const { currentUser, userToUnfollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToUnfollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: unFollowMutation,
          variables: { input },
        });
      const currentUserFollowingFeed = await feedRepo.findOneOrFail(
        currentUser.followingFeedId
      );
      expect(currentUserFollowingFeed.page.ids).not.toContain(
        userToUnfollow.id
      );
    });

    it(`should update the userToUnfollow's followers feed`, async () => {
      const { currentUser, userToUnfollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToUnfollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: unFollowMutation,
          variables: { input },
        });
      const userToFollowFollowersFeed = await feedRepo.findOneOrFail(
        userToUnfollow.followerFeedId
      );
      expect(userToFollowFollowersFeed.page.ids).not.toContain(currentUser.id);
    });

    it(`should update the currentUser's stats`, async () => {
      const { currentUser, userToUnfollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToUnfollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: unFollowMutation,
          variables: { input },
        });
      const currentUserUpdated = await userRepo.findOneOrFail(currentUser.id);
      expect(currentUserUpdated?._stats?.followingCount).toBe(0);
    });

    it(`should update the userToUnfollow's follower count`, async () => {
      const { currentUser, userToUnfollow } = await setupUsersAndFeeds();
      const input: FollowUserInput = {
        userId: userToUnfollow.id,
      };
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: unFollowMutation,
          variables: { input },
        });
      const userToFollowUpdated = await userRepo.findOneOrFail(
        userToUnfollow.id
      );
      expect(userToFollowUpdated?._stats?.followerCount).toBe(0);
    });

    // TODO test background jobs
  });

  describe('blockUser', () => {
    const blockUserMutation = /* GraphQL */ `
      mutation BlockUser($input: BlockUserInput!) {
        blockUser(input: $input) {
          ... on BlockUserResult {
            isSuccessful
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    it('should return an error if the user is not found', async () => {
      const currentUser = UserEntityFake();
      const input: BlockUserInput = {
        userId: 'fake-id',
      };
      await userRepo.insert(currentUser);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: blockUserMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          blockUser: {
            __typename: 'SmartError',
            message: 'user not found',
          },
        },
      });
    });

    it('should return an error if the user attempt to block themselves', async () => {
      const currentUser = UserEntityFake();
      const input: BlockUserInput = {
        userId: currentUser.id,
      };
      await userRepo.insert(currentUser);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: blockUserMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          blockUser: {
            __typename: 'SmartError',
            message: 'you cannot block yourself',
          },
        },
      });
    });

    it('should return an error if the user attempt to block themselves', async () => {
      const currentUser = UserEntityFake();
      const input: BlockUserInput = {
        userId: currentUser.id,
      };
      await userRepo.insert(currentUser);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: blockUserMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          blockUser: {
            __typename: 'SmartError',
            message: 'you cannot block yourself',
          },
        },
      });
    });

    it('should add the blocked user to the users new blocked list feed', async () => {
      const currentUser = UserEntityFake();
      const userToBlock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const blockedListFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id)
      );
      expect(blockedListFeed.page.ids).toContain(userToBlock.id);
    });

    it('should add the block list feed id to the currentUser', async () => {
      const currentUser = UserEntityFake();
      const userToBlock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const currentUserUpdated = await userRepo.findOneOrFail(currentUser.id);
      expect(currentUserUpdated?.blockListFeedId).toBe(
        toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id)
      );
    });

    it('should add the blocked user to the users old blocked list feed', async () => {
      const currentUser = UserEntityFake();
      currentUser.blockListFeedId = toFeedId(
        FeedEntityType.BLOCK_LIST,
        currentUser.id
      );
      const userToBlock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      const currentUserBlockedListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id),
        page: FeedPageFake({ ids: ['someuserId'] }),
      });
      await feedRepo.insert(currentUserBlockedListFeed);
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const blockedListFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id)
      );
      expect(blockedListFeed.page.ids).toEqual(['someuserId', userToBlock.id]);
    });

    it('should add the currentUser to the blocked users new blocked by feed', async () => {
      const currentUser = UserEntityFake();
      const userToBlock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const blockedByFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, userToBlock.id)
      );
      expect(blockedByFeed.page.ids).toContain(currentUser.id);
    });

    it('should add the currentUser to the blocked users old blocked by feed', async () => {
      const currentUser = UserEntityFake();
      const userToBlock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      const userToBlockBlockedByFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, userToBlock.id),
        page: FeedPageFake({ ids: ['someuserId'] }),
      });
      await feedRepo.insert(userToBlockBlockedByFeed);
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const blockedByFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, userToBlock.id)
      );
      expect(blockedByFeed.page.ids).toEqual(['someuserId', currentUser.id]);
    });

    it('should remove the blocked user from the currentUsers following feed', async () => {
      const currentUser = UserEntityFake();
      currentUser.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        currentUser.id
      );
      const userToBlock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      const currentUserFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, currentUser.id),
        page: FeedPageFake({ ids: [userToBlock.id] }),
      });
      await feedRepo.insert(currentUserFollowingFeed);
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const followingFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.FOLLOWING, currentUser.id)
      );
      expect(followingFeed.page.ids).toEqual([]);
    });

    it('should remove the blocked user from the currentUsers followers feed', async () => {
      const currentUser = UserEntityFake();
      currentUser.followerFeedId = toFeedId(
        FeedEntityType.FOLLOWER,
        currentUser.id
      );
      const userToBlock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      const currentUserFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, currentUser.id),
        page: FeedPageFake({ ids: [userToBlock.id] }),
      });
      await feedRepo.insert(currentUserFollowerFeed);
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const followerFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.FOLLOWER, currentUser.id)
      );
      expect(followerFeed.page.ids).toEqual([]);
    });

    it('should remove the currentUser from the blocked users following feed', async () => {
      const currentUser = UserEntityFake();
      const userToBlock = UserEntityFake();
      userToBlock.followingFeedId = toFeedId(
        FeedEntityType.FOLLOWING,
        userToBlock.id
      );
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      const userToBlockFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, userToBlock.id),
        page: FeedPageFake({ ids: [currentUser.id] }),
      });
      await feedRepo.insert(userToBlockFollowingFeed);
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const followingFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.FOLLOWING, userToBlock.id)
      );
      expect(followingFeed.page.ids).toEqual([]);
    });

    it('should remove the currentUser from the blocked users followers feed', async () => {
      const currentUser = UserEntityFake();
      const userToBlock = UserEntityFake();
      userToBlock.followerFeedId = toFeedId(
        FeedEntityType.FOLLOWER,
        userToBlock.id
      );
      const input: BlockUserInput = {
        userId: userToBlock.id,
      };
      const userToBlockFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, userToBlock.id),
        page: FeedPageFake({ ids: [currentUser.id] }),
      });
      await feedRepo.insert(userToBlockFollowerFeed);
      await userRepo.insert([currentUser, userToBlock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: blockUserMutation, variables: { input } });
      const followerFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.FOLLOWER, userToBlock.id)
      );
      expect(followerFeed.page.ids).toEqual([]);
    });
  });

  describe('unblockUser', () => {
    const unblockUserMutation = /* GraphQL */ `
      mutation UnblockUser($input: UnblockUserInput!) {
        unblockUser(input: $input) {
          ... on UnblockUserResult {
            isSuccessful
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    it('should return an error if the user is not found', async () => {
      const currentUser = UserEntityFake();
      const input: BlockUserInput = {
        userId: 'fake-id',
      };
      await userRepo.insert(currentUser);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: unblockUserMutation,
          variables: { input },
        });
      expect(response.body).toMatchObject({
        data: {
          unblockUser: {
            __typename: 'SmartError',
            message: 'user not found',
          },
        },
      });
    });

    it('should remove the blocked user from the users blocked list feed', async () => {
      const currentUser = UserEntityFake();
      const userToUnblock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToUnblock.id,
      };
      const currentUserBlockedListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id),
        page: FeedPageFake({ ids: [userToUnblock.id] }),
      });
      await feedRepo.insert(currentUserBlockedListFeed);
      await userRepo.insert([currentUser, userToUnblock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: unblockUserMutation, variables: { input } });
      const blockedListFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id)
      );
      expect(blockedListFeed.page.ids).toEqual([]);
    });

    it('should remove the currentUser from the blocked users blocked by feed', async () => {
      const currentUser = UserEntityFake();
      const userToUnblock = UserEntityFake();
      const input: BlockUserInput = {
        userId: userToUnblock.id,
      };
      const userToUnblockBlockedByFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, userToUnblock.id),
        page: FeedPageFake({ ids: [currentUser.id] }),
      });
      await feedRepo.insert(userToUnblockBlockedByFeed);
      await userRepo.insert([currentUser, userToUnblock]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({ query: unblockUserMutation, variables: { input } });
      const blockedByFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, userToUnblock.id)
      );
      expect(blockedByFeed.page.ids).toEqual([]);
    });
  });

  describe('invitesConnection', () => {
    const invitesConnectionQuery = /* GraphQL */ `
      query InvitesConnection(
        $getUserInput: GetUserInput!
        $invitesConnectionInput: InvitesConnectionInput!
      ) {
        getUser(input: $getUserInput) {
          ... on GetUserResult {
            user {
              invitesConnection(input: $invitesConnectionInput) {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                  count
                  totalCount
                }
                edges {
                  cursor
                  node {
                    user {
                      id
                    }
                    state
                  }
                }
              }
            }
          }
        }
      }
    `;

    it('should return an empty list if the user has not invited any users', async () => {
      const currentUser = UserEntityFake();
      const invitesListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({ ids: [] }),
      });
      await Promise.all([
        userRepo.insert(currentUser),
        feedRepo.insert(invitesListFeed),
      ]);
      const getUserInput: GetUserInput = {
        id: currentUser.id,
      };
      const invitesConnectionInput: InvitesConnectionInput = {
        paginationInput: {
          take: 10,
        },
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: invitesConnectionQuery,
          variables: { getUserInput, invitesConnectionInput },
        });
      const expectedResponse: InvitesConnection = {
        edges: [],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
      expect(response.body).toMatchObject({
        data: {
          getUser: {
            user: {
              invitesConnection: expectedResponse,
            },
          },
        },
      });
    });

    it('should return a list of users the user has invited', async () => {
      const currentUser = UserEntityFake();
      const invitedUser1 = UserEntityFake();
      const invitedUser2 = UserEntityFake();
      const invitesListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({ ids: [invitedUser1.id, invitedUser2.id] }),
      });
      await Promise.all([
        userRepo.insert([currentUser, invitedUser1, invitedUser2]),
        feedRepo.insert(invitesListFeed),
      ]);
      const getUserInput: GetUserInput = {
        id: currentUser.id,
      };
      const invitesConnectionInput: InvitesConnectionInput = {
        paginationInput: {
          take: 10,
        },
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: invitesConnectionQuery,
          variables: { getUserInput, invitesConnectionInput },
        });
      const expectedResponse: InvitesConnection = {
        edges: [
          {
            node: {
              user: {
                id: invitedUser1.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser1.id,
          },
          {
            node: {
              user: {
                id: invitedUser2.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser2.id,
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
      expect(response.body).toMatchObject({
        data: {
          getUser: {
            user: {
              invitesConnection: expectedResponse,
            },
          },
        },
      });
    });

    it('should return take number of users the user has invited', async () => {
      const currentUser = UserEntityFake();
      const invitedUser1 = UserEntityFake();
      const invitedUser2 = UserEntityFake();
      const invitedUser3 = UserEntityFake();
      const invitesListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: [invitedUser1.id, invitedUser2.id, invitedUser3.id],
        }),
      });
      await Promise.all([
        userRepo.insert([
          currentUser,
          invitedUser1,
          invitedUser2,
          invitedUser3,
        ]),
        feedRepo.insert(invitesListFeed),
      ]);
      const getUserInput: GetUserInput = {
        id: currentUser.id,
      };
      const invitesConnectionInput: InvitesConnectionInput = {
        paginationInput: {
          take: 2,
        },
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: invitesConnectionQuery,
          variables: { getUserInput, invitesConnectionInput },
        });
      const expectedResponse: InvitesConnection = {
        edges: [
          {
            node: {
              user: {
                id: invitedUser1.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser1.id,
          },
          {
            node: {
              user: {
                id: invitedUser2.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser2.id,
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          endCursor: invitedUser2.id,
        },
      };
      expect(response.body).toMatchObject({
        data: {
          getUser: {
            user: {
              invitesConnection: expectedResponse,
            },
          },
        },
      });
    });

    it('should return users after the cursor', async () => {
      const currentUser = UserEntityFake();
      const invitedUser1 = UserEntityFake();
      const invitedUser2 = UserEntityFake();
      const invitedUser3 = UserEntityFake();
      const invitedUser4 = UserEntityFake();
      const invitesListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: [
            invitedUser1.id,
            invitedUser2.id,
            invitedUser3.id,
            invitedUser4.id,
          ],
        }),
      });
      await Promise.all([
        userRepo.insert([
          currentUser,
          invitedUser1,
          invitedUser2,
          invitedUser3,
          invitedUser4,
        ]),
        feedRepo.insert(invitesListFeed),
      ]);
      const getUserInput: GetUserInput = {
        id: currentUser.id,
      };
      const invitesConnectionInput: InvitesConnectionInput = {
        paginationInput: {
          take: 2,
          after: invitedUser1.id,
        },
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: invitesConnectionQuery,
          variables: { getUserInput, invitesConnectionInput },
        });
      const expectedResponse: InvitesConnection = {
        edges: [
          {
            node: {
              user: {
                id: invitedUser2.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser2.id,
          },
          {
            node: {
              user: {
                id: invitedUser3.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser3.id,
          },
        ],
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: true,
        },
      };
      expect(response.body).toMatchObject({
        data: {
          getUser: {
            user: {
              invitesConnection: expectedResponse,
            },
          },
        },
      });
    });

    it('should return users includingAndAfter the cursor', async () => {
      const currentUser = UserEntityFake();
      const invitedUser1 = UserEntityFake();
      const invitedUser2 = UserEntityFake();
      const invitedUser3 = UserEntityFake();
      const invitedUser4 = UserEntityFake();
      const invitesListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: [
            invitedUser1.id,
            invitedUser2.id,
            invitedUser3.id,
            invitedUser4.id,
          ],
        }),
      });
      await Promise.all([
        userRepo.insert([
          currentUser,
          invitedUser1,
          invitedUser2,
          invitedUser3,
          invitedUser4,
        ]),
        feedRepo.insert(invitesListFeed),
      ]);
      const getUserInput: GetUserInput = {
        id: currentUser.id,
      };
      const invitesConnectionInput: InvitesConnectionInput = {
        paginationInput: {
          take: 2,
          includingAndAfter: invitedUser2.id,
        },
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: invitesConnectionQuery,
          variables: { getUserInput, invitesConnectionInput },
        });
      const expectedResponse: InvitesConnection = {
        edges: [
          {
            node: {
              user: {
                id: invitedUser2.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser2.id,
          },
          {
            node: {
              user: {
                id: invitedUser3.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser3.id,
          },
        ],
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: true,
        },
      };
      expect(response.body).toMatchObject({
        data: {
          getUser: {
            user: {
              invitesConnection: expectedResponse,
            },
          },
        },
      });
    });

    it('should return users before the cursor', async () => {
      const currentUser = UserEntityFake();
      const invitedUser1 = UserEntityFake();
      const invitedUser2 = UserEntityFake();
      const invitedUser3 = UserEntityFake();
      const invitedUser4 = UserEntityFake();
      const invitesListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: [
            invitedUser1.id,
            invitedUser2.id,
            invitedUser3.id,
            invitedUser4.id,
          ],
        }),
      });
      await Promise.all([
        userRepo.insert([
          currentUser,
          invitedUser1,
          invitedUser2,
          invitedUser3,
          invitedUser4,
        ]),
        feedRepo.insert(invitesListFeed),
      ]);
      const getUserInput: GetUserInput = {
        id: currentUser.id,
      };
      const invitesConnectionInput: InvitesConnectionInput = {
        paginationInput: {
          take: 2,
          before: invitedUser2.id,
        },
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: invitesConnectionQuery,
          variables: { getUserInput, invitesConnectionInput },
        });
      const expectedResponse: InvitesConnection = {
        edges: [
          {
            node: {
              user: {
                id: invitedUser1.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser1.id,
          },
        ],
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: false,
        },
      };
      expect(response.body).toMatchObject({
        data: {
          getUser: {
            user: {
              invitesConnection: expectedResponse,
            },
          },
        },
      });
    });

    it('should return users includingAndBefore the cursor', async () => {
      const currentUser = UserEntityFake();
      const invitedUser1 = UserEntityFake();
      const invitedUser2 = UserEntityFake();
      const invitedUser3 = UserEntityFake();
      const invitedUser4 = UserEntityFake();
      const invitesListFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: [
            invitedUser1.id,
            invitedUser2.id,
            invitedUser3.id,
            invitedUser4.id,
          ],
        }),
      });
      await Promise.all([
        userRepo.insert([
          currentUser,
          invitedUser1,
          invitedUser2,
          invitedUser3,
          invitedUser4,
        ]),
        feedRepo.insert(invitesListFeed),
      ]);
      const getUserInput: GetUserInput = {
        id: currentUser.id,
      };
      const invitesConnectionInput: InvitesConnectionInput = {
        paginationInput: {
          includingAndBefore: invitedUser4.id,
        },
      };
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: invitesConnectionQuery,
          variables: { getUserInput, invitesConnectionInput },
        });
      const expectedResponse: InvitesConnection = {
        edges: [
          {
            node: {
              user: {
                id: invitedUser1.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser1.id,
          },
          {
            node: {
              user: {
                id: invitedUser2.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser2.id,
          },
          {
            node: {
              user: {
                id: invitedUser3.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser3.id,
          },
          {
            node: {
              user: {
                id: invitedUser4.id,
              },
              state: InviteState.JOINED_PENDING_VERIFICATION,
            },
            cursor: invitedUser4.id,
          },
        ],
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
      expect(response.body).toMatchObject({
        data: {
          getUser: {
            user: {
              invitesConnection: expectedResponse,
            },
          },
        },
      });
    });
  });
});
