import { INestApplication, Post } from '@nestjs/common';
import { AdminNotificationModule } from '@verdzie/server/admin/notification/adminNotification.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection } from 'typeorm';
import { FirebaseService } from '@verdzie/server/firebase/firebase.service';
import supertest from 'supertest';
import { PublicPostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import {
  getChallengeParticipantsFeedId,
  toChallengeParticipantIdString,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { NotificationContentEntity } from '@verdzie/server/admin/notification/notificationContent.entity';
import { CreateNotificationDto } from '@verdzie/server/admin/notification/dto/create-notification.dto';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { log } from 'console';
import { ValidationError } from 'apollo-server-express';

describe('AdminNotification', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeAll(async () => {
    const notificationModule = await createMockedTestingModule({
      imports: [WildrTypeormModule, WildrBullModule, AdminNotificationModule],
    });
    app = notificationModule.createNestApplication();
    conn = await getTestConnection();
    await conn.synchronize(true);
    await app.init();
    await app.listen(Number(process.env.ADMIN_HTTP_PORT));
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
  });

  describe('sendGeneralNotification', () => {
    beforeEach(async () => {
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    it('should send a notification to all users', async () => {
      const recipients = Array.from({ length: 10 }, () => UserEntityFake());
      const recipientFCMTokens = recipients.map(r => r.fcmToken);
      await conn.getRepository(UserEntity).insert(recipients);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification')
        .send({
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          scope: 'ALL',
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        status: 'OK',
        message: `Successfully sent notification to ${recipients.length} users`,
        notificationsSentCount: recipients.length,
        warnings: {
          failedNotifications: [],
          failedOffsets: [],
        },
      });
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(recipientFCMTokens, {
        notification: {
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
        },
        data: {
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          routName: undefined,
          marketing: undefined,
          verb: undefined,
        },
      });
    });

    it('should send a notification to group of users', async () => {
      const allUsers = Array.from({ length: 10 }, () => UserEntityFake());
      const recipients = allUsers.slice(0, 5);
      const recipientFCMTokens = recipients.map(r => r.fcmToken);
      await conn.getRepository(UserEntity).insert(recipients);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification')
        .send({
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          scope: 'ALL',
          userIds: recipients.map(r => r.id),
        });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        status: 'OK',
        message: `Successfully sent notification to ${recipients.length} users`,
        notificationsSentCount: recipients.length,
        warnings: {
          failedNotifications: [],
          failedOffsets: [],
        },
      });
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(recipientFCMTokens, {
        notification: {
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
        },
        data: {
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          routName: undefined,
          marketing: undefined,
          verb: undefined,
        },
      });
    });
  });

  describe('sendTrendingPostNotification', () => {
    beforeEach(async () => {
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    it('should send a notification to all users', async () => {
      const recipients = Array.from({ length: 10 }, () => UserEntityFake());
      const recipientFCMTokens = recipients.map(r => r.fcmToken);
      const postAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([postAuthor, ...recipients]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification/trending-post-notification')
        .send({
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          postId: post.id,
        });
      expect(response.status).toBe(201);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(recipientFCMTokens, {
        notification: {
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
        },
        data: {
          verb: ActivityVerb.POSTED,
          postId: post.id,
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          marketing: expect.any(String),
        },
      });
    });

    it('should send a notification to a list of users', async () => {
      const allUsers = Array.from({ length: 10 }, () => UserEntityFake());
      const recipients = allUsers.slice(0, 5);
      const postAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([postAuthor, ...allUsers]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification/trending-post-notification')
        .send({
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          postId: post.id,
          handles: recipients.map(r => r.handle),
        });
      expect(response.status).toBe(201);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(
        recipients.map(r => r.fcmToken),
        {
          notification: {
            title: `Brian's post is trending!`,
            body: `Tap to check it out!`,
          },
          data: {
            verb: ActivityVerb.POSTED,
            postId: post.id,
            title: `Brian's post is trending!`,
            body: `Tap to check it out!`,
            marketing: expect.any(String),
          },
        }
      );
    });

    it('should return all response data and warnings', async () => {
      const allUsers = Array.from({ length: 3 }, () => UserEntityFake());
      const postAuthor = UserEntityFake();
      const otherHandles = ['notfound', 'notfound2'];
      await conn.getRepository(UserEntity).insert([postAuthor, ...allUsers]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification/trending-post-notification')
        .send({
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          postId: post.id,
          handles: ['notfound', 'notfound2', ...allUsers.map(u => u.handle)],
        });
      expect(response.status).toBe(201);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(
        allUsers.map(u => u.fcmToken),
        {
          notification: {
            title: `Brian's post is trending!`,
            body: `Tap to check it out!`,
          },
          data: {
            verb: ActivityVerb.POSTED,
            postId: post.id,
            title: `Brian's post is trending!`,
            body: `Tap to check it out!`,
            marketing: expect.any(String),
          },
        }
      );
      expect(response.body.message).toBeDefined();
      expect(response.body.marketingTag).toBeDefined();
      expect(response.body.notificationSentCount).toBe(allUsers.length);
      expect(response.body.warnings.notFoundUsers).toEqual(otherHandles);
    });

    it('should return list of failed notifications', async () => {
      const allUsers = Array.from({ length: 3 }, () => UserEntityFake());
      const postAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([postAuthor, ...allUsers]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      app.get(FirebaseService).app.messaging().sendToDevice = jest
        .fn()
        .mockRejectedValueOnce(new Error('test'));
      const response = await supertest(app.getHttpServer())
        .post('/notification/trending-post-notification')
        .send({
          title: `Brian's post is trending!`,
          body: `Tap to check it out!`,
          postId: post.id,
          handles: [...allUsers.map(u => u.handle)],
        });
      expect(response.status).toBe(201);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(
        allUsers.map(u => u.fcmToken),
        {
          notification: {
            title: `Brian's post is trending!`,
            body: `Tap to check it out!`,
          },
          data: {
            verb: ActivityVerb.POSTED,
            postId: post.id,
            title: `Brian's post is trending!`,
            body: `Tap to check it out!`,
            marketing: expect.any(String),
          },
        }
      );
      expect(response.body.message).toBeDefined();
      expect(response.body.marketingTag).toBeDefined();
      expect(response.body.notificationSentCount).toBe(0);
      expect(response.body.warnings.failedNotifications).toEqual(
        allUsers.map(u => {
          return {
            userId: u.id,
            error: 'Error: test',
          };
        })
      );
    });
  });

  describe('sendTrendingChallengeNotification', () => {
    beforeEach(async () => {
      await conn.getRepository(ChallengeEntity).delete({});
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    it('should send a challenge trending notification to all users', async () => {
      const allUsers = Array.from({ length: 10 }, () => UserEntityFake());
      const challengeAuthor = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, ...allUsers]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification/trending-challenge-notification')
        .send({
          title: `Brian's challenge is trending!`,
          body: `Tap to check it out!`,
          challengeId: challenge.id,
        });
      expect(response.status).toBe(201);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(
        allUsers.map(u => u.fcmToken),
        {
          notification: {
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
          },
          data: {
            challengeId: challenge.id,
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
            marketing: expect.any(String),
            verb: ActivityVerb.CHALLENGE_CREATED,
          },
        }
      );
    });

    it('should send a challenge trending notification to a group of users', async () => {
      const allUsers = Array.from({ length: 10 }, () => UserEntityFake());
      const recipients = allUsers.slice(0, 5);
      const challengeAuthor = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, ...allUsers]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification/trending-challenge-notification')
        .send({
          title: `Brian's challenge is trending!`,
          body: `Tap to check it out!`,
          challengeId: challenge.id,
          handles: recipients.map(u => u.handle),
        });
      expect(response.status).toBe(201);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(
        recipients.map(u => u.fcmToken),
        {
          notification: {
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
          },
          data: {
            challengeId: challenge.id,
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
            marketing: expect.any(String),
            verb: ActivityVerb.CHALLENGE_CREATED,
          },
        }
      );
    });
  });

  describe('sendNotificationToChallengeParticipants', () => {
    beforeEach(async () => {
      await conn.getRepository(ChallengeEntity).delete({});
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    it('should send notifications to the participants of a challenge', async () => {
      const allUsers = Array.from({ length: 100 }, () => UserEntityFake());
      const challengeAuthor = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, ...allUsers]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor, ...allUsers]
        .slice(0, 6)
        .map(u =>
          toChallengeParticipantIdString({
            postId: '',
            id: u.id,
            entryCount: 0,
          })
        );
      challengeParticipantsFeed.count =
        challengeParticipantsFeed.page.ids.length;
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification/challenge-participants-notification')
        .send({
          title: `Brian's challenge is trending!`,
          body: `Tap to check it out!`,
          challengeId: challenge.id,
        });
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'OK',
        marketingTag: expect.any(String),
        message: 'Notification sent to 5 challenge participants',
        notificationSentCount: 5,
        warnings: {
          failedNotifications: [],
        },
      });
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(
        allUsers.slice(0, 5).map(u => u.fcmToken),
        {
          notification: {
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
          },
          data: {
            challengeId: challenge.id,
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
            marketing: expect.any(String),
            verb: ActivityVerb.CHALLENGE_CREATED,
          },
        }
      );
    });

    it('should send notifications to the participants and challenge author', async () => {
      const allUsers = Array.from({ length: 100 }, () => UserEntityFake());
      const challengeAuthor = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, ...allUsers]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor, ...allUsers]
        .slice(0, 6)
        .map(u =>
          toChallengeParticipantIdString({
            postId: '',
            id: u.id,
            entryCount: 0,
          })
        );
      challengeParticipantsFeed.count =
        challengeParticipantsFeed.page.ids.length;
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      app.get(FirebaseService).app.messaging().sendToDevice = jest.fn();
      const response = await supertest(app.getHttpServer())
        .post('/notification/challenge-participants-notification')
        .send({
          title: `Brian's challenge is trending!`,
          body: `Tap to check it out!`,
          challengeId: challenge.id,
          includeAuthor: true,
        });
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'OK',
        marketingTag: expect.any(String),
        message: 'Notification sent to 6 challenge participants',
        notificationSentCount: 6,
        warnings: {
          failedNotifications: [],
        },
      });
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledTimes(1);
      expect(
        app.get(FirebaseService).app.messaging().sendToDevice
      ).toHaveBeenCalledWith(
        [challengeAuthor, ...allUsers].slice(0, 6).map(u => u.fcmToken),
        {
          notification: {
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
          },
          data: {
            challengeId: challenge.id,
            title: `Brian's challenge is trending!`,
            body: `Tap to check it out!`,
            marketing: expect.any(String),
            verb: ActivityVerb.CHALLENGE_CREATED,
          },
        }
      );
    });
  });

  describe('createNotification', () => {
    beforeEach(async () => {
      await conn.getRepository(NotificationContentEntity).delete({});
    });

    it('shoud create notification with activity verb', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/notification/create-notification')
        .send({
          title: 'Test title',
          message: 'Test message',
          fcmData: {
            verb: 'REACTION_LIKE',
          },
        });
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'OK',
        message: 'Notification successfully created',
        messageData: {
          title: 'Test title',
          message: 'Test message',
          fcmData: {
            verb: 'REACTION_LIKE',
          },
        },
      });
    });

    it('shoud create notification with route', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/notification/create-notification')
        .send({
          title: 'Test title',
          message: 'Test message',
          fcmData: {
            route: 'Test route',
          },
        });
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        status: 'OK',
        message: 'Notification successfully created',
        messageData: {
          title: 'Test title',
          message: 'Test message',
          fcmData: {
            route: 'Test route',
          },
        },
      });
    });

    it('should return error \'Verb must be a valid value from ActivityVerb.\'', async () => {
      const data = {
        title: 'Test title',
        message: 'Test message',
        fcmData: {
          verb: 'INVALID_VERB',
        },
      }
      const dataDto = plainToClass(CreateNotificationDto, data)
      const errors = await validate(dataDto)
      const hasExpectedErrorMessage = errors.some(error =>
        Object.values(error.constraints || {}).includes('Verb must be a valid value from ActivityVerb.')
      );
      expect(errors.length).not.toBe(0)
      expect(hasExpectedErrorMessage).toBe(true);
      const response = await supertest(app.getHttpServer())
        .post('/notification/create-notification')
        .send(dataDto);
    });

    it('should return error \'fcmData must contain verb or route.\'', async () => {
      const data = {
        title: 'Test title',
        message: 'Test message',
        fcmData: {},
      }
      const dataDto = plainToClass(CreateNotificationDto, data)
      const errors = await validate(dataDto)
      const hasExpectedErrorMessage = errors.some(error =>
        Object.values(error.constraints || {}).includes('fcmData must contain verb or route.')
      );
      expect(errors.length).not.toBe(0)
      expect(hasExpectedErrorMessage).toBe(true);
      const response = await supertest(app.getHttpServer())
        .post('/notification/create-notification')
        .send(dataDto);
    });
  });
});
