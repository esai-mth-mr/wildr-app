import { INestApplication } from '@nestjs/common';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { InviteCodeEntity } from '@verdzie/server/invite-code/inviteCode.entity';
import { InviteCodeResolverModule } from '@verdzie/server/invite-code/inviteCodeResolver.module';
import { getJWT } from '@verdzie/test/utils/auth';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import supertest from 'supertest';
import { Connection, Repository } from 'typeorm';
import { InviteCodeEntityFake } from '@verdzie/server/invite-code/testing/invite-code-entity-fake';
import { InviteCodeAction } from '@verdzie/server/invite-code/inviteCode.helper';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserListEntityFake } from '@verdzie/server/user-list/testing/userList.entity.fake';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';

describe('InviteCode', () => {
  let app: INestApplication;
  let conn: Connection;
  let inviteCodeRepo: Repository<InviteCodeEntity>;
  let userRepo: Repository<UserEntity>;
  let feedRepo: Repository<FeedEntity>;
  let userListRepo: Repository<UserListEntity>;

  beforeAll(async () => {
    const appModule = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        InviteCodeResolverModule,
      ],
    });
    app = appModule.createNestApplication();
    conn = await getTestConnection();
    await conn.synchronize(true);
    inviteCodeRepo = conn.getRepository(InviteCodeEntity);
    userRepo = conn.getRepository(UserEntity);
    feedRepo = conn.getRepository(FeedEntity);
    userListRepo = conn.getRepository(UserListEntity);
    await app.init();
  });

  const cleanDb = async () => {
    await inviteCodeRepo.delete({});
    await userRepo.delete({});
    await feedRepo.delete({});
    await userListRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await conn.close();
    await app.close();
  });

  describe('checkAndRedeemInviteCode', () => {
    const checkAndRedeemInviteCodeMutation = /* GraphQL */ `
      query CheckAndRedeemInviteCode($input: CheckAndRedeemInviteCodeInput!) {
        checkAndRedeemInviteCode(input: $input) {
          ... on CheckAndRedeemInviteCodeResult {
            isValid
            hasBeenRedeemed
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    it('should return false if code is not found', async () => {
      const user = UserEntityFake();
      await userRepo.insert(user);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: checkAndRedeemInviteCodeMutation,
          variables: {
            input: {
              code: 1234,
            },
          },
        });
      expect(result.body.data.checkAndRedeemInviteCode).toEqual({
        isValid: false,
        hasBeenRedeemed: null,
      });
    });

    it('should return redeemed as true if invite code has already been redeemed', async () => {
      const user = UserEntityFake();
      const inviteCode = InviteCodeEntityFake();
      inviteCode.redeemedAt = new Date();
      await userRepo.insert(user);
      await inviteCodeRepo.insert(inviteCode);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: checkAndRedeemInviteCodeMutation,
          variables: {
            input: {
              code: inviteCode.code,
            },
          },
        });
      expect(result.body.data.checkAndRedeemInviteCode).toEqual({
        isValid: true,
        hasBeenRedeemed: true,
      });
    });

    it('should redeem the invite code', async () => {
      const user = UserEntityFake();
      const inviteCode = InviteCodeEntityFake({
        redeemedByUserIds: ['somebody'],
        redeemedCount: 1,
      });
      await userRepo.insert(user);
      await inviteCodeRepo.insert(inviteCode);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: checkAndRedeemInviteCodeMutation,
          variables: {
            input: {
              code: inviteCode.code,
            },
          },
        });
      expect(result.body.data.checkAndRedeemInviteCode).toEqual({
        isValid: true,
        hasBeenRedeemed: null,
      });
      const updatedInviteCode = await inviteCodeRepo.findOne(inviteCode.id);
      expect(updatedInviteCode?.redeemedAt).toBeDefined();
      expect(updatedInviteCode?.redeemedByUserIds).toEqual([
        'somebody',
        user.id,
      ]);
      expect(updatedInviteCode?.redeemedCount).toEqual(2);
    });

    it('should redeem a SHARE_CHALLENGE a invite code', async () => {
      const user = UserEntityFake();
      const inviter = UserEntityFake();
      const inviteCode = InviteCodeEntityFake({
        redeemedByUserIds: ['somebody'],
        redeemedCount: 1,
        action: InviteCodeAction.SHARE_CHALLENGE,
        inviterId: inviter.id,
      });
      await userRepo.insert([user, inviter]);
      await inviteCodeRepo.insert(inviteCode);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: checkAndRedeemInviteCodeMutation,
          variables: {
            input: {
              code: inviteCode.code,
            },
          },
        });
      expect(result.body.data.checkAndRedeemInviteCode).toEqual({
        isValid: true,
        hasBeenRedeemed: null,
      });
      const updatedInviteCode = await inviteCodeRepo.findOne(inviteCode.id);
      expect(updatedInviteCode?.redeemedAt).toBeDefined();
      expect(updatedInviteCode?.redeemedByUserIds).toEqual([
        'somebody',
        user.id,
      ]);
      expect(updatedInviteCode?.redeemedCount).toEqual(2);
    });

    it('should return if the invite code is owned by the user', async () => {
      const user = UserEntityFake();
      const inviteCode = InviteCodeEntityFake({
        inviterId: user.id,
        action: InviteCodeAction.ADD_TO_FOLLOWING_LIST,
      });
      await userRepo.insert(user);
      await inviteCodeRepo.insert(inviteCode);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: checkAndRedeemInviteCodeMutation,
          variables: {
            input: {
              code: inviteCode.code,
            },
          },
        });
      expect(result.body.data.checkAndRedeemInviteCode).toEqual({
        isValid: false,
        hasBeenRedeemed: false,
      });
    });

    it('should add the user to the owners following list', async () => {
      const user = UserEntityFake();
      const owner = UserEntityFake();
      const ownerFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, owner.id),
      });
      const ownerFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, owner.id),
      });
      const ownerInnerCircleSuggestionsList = FeedEntityFake({
        id: toFeedId(FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST, owner.id),
      });
      owner.followingFeedId = ownerFollowingFeed.id;
      owner.followerFeedId = ownerFollowerFeed.id;
      const userFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, user.id),
      });
      const userFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, user.id),
      });
      user.followerFeedId = userFollowerFeed.id;
      user.followingFeedId = userFollowingFeed.id;
      const inviteCode = InviteCodeEntityFake({
        inviterId: owner.id,
        action: InviteCodeAction.ADD_TO_FOLLOWING_LIST,
      });
      await feedRepo.insert([
        ownerFollowerFeed,
        ownerFollowingFeed,
        ownerInnerCircleSuggestionsList,
        userFollowerFeed,
        userFollowingFeed,
      ]);
      await userRepo.insert([user, owner]);
      await inviteCodeRepo.insert(inviteCode);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: checkAndRedeemInviteCodeMutation,
          variables: {
            input: {
              code: inviteCode.code,
            },
          },
        });
      expect(result.body.data.checkAndRedeemInviteCode).toEqual({
        isValid: true,
        hasBeenRedeemed: true,
      });
      const updatedOwnerFollowingFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.FOLLOWING, owner.id)
      );
      expect(updatedOwnerFollowingFeed?.page.ids).toEqual([user.id]);
      const updatedUserFollowerFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.FOLLOWER, user.id)
      );
      expect(updatedUserFollowerFeed?.page.ids).toEqual([owner.id]);
      const updatedOwnerInnerCircleSuggestionsList = await feedRepo.findOne(
        toFeedId(FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST, owner.id)
      );
      expect(updatedOwnerInnerCircleSuggestionsList?.page.ids).toEqual([
        user.id,
      ]);
    });

    it('should add the user to the owners inner circle list', async () => {
      const user = UserEntityFake();
      const owner = UserEntityFake();
      const ownerFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, owner.id),
      });
      const ownerFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, owner.id),
      });
      const ownerInnerCircleList = UserListEntityFake({
        id: innerCircleListId(owner.id),
      });
      const ownerInnerCircleSuggestionsList = FeedEntityFake({
        id: toFeedId(FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST, owner.id),
      });
      owner.followingFeedId = ownerFollowingFeed.id;
      owner.followerFeedId = ownerFollowerFeed.id;
      const userFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, user.id),
      });
      const userFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, user.id),
      });
      user.followerFeedId = userFollowerFeed.id;
      // user.followingFeedId = userFollowingFeed.id;
      const inviteCode = InviteCodeEntityFake({
        inviterId: owner.id,
        action: InviteCodeAction.ADD_TO_INNER_LIST,
      });
      await feedRepo.insert([
        ownerFollowerFeed,
        ownerFollowingFeed,
        ownerInnerCircleSuggestionsList,
        userFollowerFeed,
        userFollowingFeed,
      ]);
      await userListRepo.insert(ownerInnerCircleList);
      await userRepo.insert([user, owner]);
      await inviteCodeRepo.insert(inviteCode);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: checkAndRedeemInviteCodeMutation,
          variables: {
            input: {
              code: inviteCode.code,
            },
          },
        });
      expect(result.body.data.checkAndRedeemInviteCode).toEqual({
        isValid: true,
        hasBeenRedeemed: true,
      });
      const updatedOwnerFollowingFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.FOLLOWING, owner.id)
      );
      expect(updatedOwnerFollowingFeed?.page.ids).toEqual([user.id]);
      const updatedUserFollowerFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.FOLLOWER, user.id)
      );
      expect(updatedUserFollowerFeed?.page.ids).toEqual([owner.id]);
      const updatedOwnerInnerCircleList = await userListRepo.findOne(
        innerCircleListId(owner.id)
      );
      expect(updatedOwnerInnerCircleList?.ids).toEqual([user.id]);
    });
  });
});
