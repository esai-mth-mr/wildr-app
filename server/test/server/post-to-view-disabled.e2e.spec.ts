import { INestApplication } from '@nestjs/common';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection } from 'typeorm';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  PublicPostEntityFake,
} from '@verdzie/server/post/testing/post.fake';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  getUserPostEntriesOnChallengeFeedId,
  toChallengeParticipantPostEntryStr,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import supertest from 'supertest';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { PostResolverModule } from '@verdzie/server/post/post-resolver/post.resolver.module';
import { ReactionType, RepostInput } from '@verdzie/server/generated-graphql';
import { getJWT } from '@verdzie/test/utils/auth';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { ID_SEPARATOR, generateId } from '@verdzie/server/common/generateId';
import { ChallengeResolverModule } from '@verdzie/server/challenge/challenge-resolver/challengeResolver.module';
import { ChallengeEntriesModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries.module';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import {
  addJoinedChallenge,
  toUserJoinedChallengeString,
  updateJoinedChallengeEntryPost,
} from '@verdzie/server/challenge/userJoinedChallenges.helper';
import sinon from 'sinon';
import { TIMEZONE_OFFSET_HEADER } from '@verdzie/server/request/request.constants';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { CommentVisibilityAccess } from '@verdzie/server/post/postAccessControl';

describe('Post', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeAll(async () => {
    process.env.CHALLENGE_POST_TO_VIEW_ENABLED = 'false';
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        PostModule,
        PostResolverModule,
        ChallengeResolverModule,
        ChallengeEntriesModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    await conn.synchronize(true);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
  });

  describe('isHiddenOnChallenge disabled', () => {
    const isHiddenOnChallengeQuery = /* GraphQL */ `
      query GetPost($getPostInput: GetPostInput!) {
        getPost(input: $getPostInput) {
          ... on GetPostResult {
            post {
              isHiddenOnChallenge
            }
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    it('should not show authors post as hidden if user has no entries today', async () => {
      const challengeAuthor = UserEntityFake();
      const participant = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: participant, challenge: challenge });
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, participant]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const oldParticipantPost = PublicPostEntityFake({
        authorId: participant.id,
        parentChallengeId: challenge.id,
        createdAt: new Date('2020-01-01'),
      });
      updateJoinedChallengeEntryPost({
        post: oldParticipantPost,
        challengeId: challenge.id,
        user: participant,
      });
      const todaysAuthorPost = PublicPostEntityFake({
        authorId: challengeAuthor.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      const userPostEntriesOnChallengeFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(challenge.id, participant.id),
      });
      userPostEntriesOnChallengeFeed.page.ids = [
        toChallengeParticipantPostEntryStr({
          postId: oldParticipantPost.id,
          authorId: participant.id,
          date: oldParticipantPost.createdAt,
          hasPinned: false,
        }),
      ];
      await conn
        .getRepository(FeedEntity)
        .insert([userPostEntriesOnChallengeFeed]);
      await conn
        .getRepository(PostEntity)
        .insert([oldParticipantPost, todaysAuthorPost]);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: todaysAuthorPost.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });

    it('should not show authors post is hidden if user has entry today', async () => {
      const challengeAuthor = UserEntityFake();
      const participant = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: participant, challenge: challenge });
      const todaysParticipantPost = PublicPostEntityFake({
        authorId: participant.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      updateJoinedChallengeEntryPost({
        user: participant,
        challengeId: challenge.id,
        post: todaysParticipantPost,
      });
      const todaysAuthorPost = PublicPostEntityFake({
        authorId: challengeAuthor.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, participant]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      await conn
        .getRepository(PostEntity)
        .insert([todaysParticipantPost, todaysAuthorPost]);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: todaysAuthorPost.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });

    it('should not show authors post is hidden if user has no entries', async () => {
      const challengeAuthor = UserEntityFake();
      const participant = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: participant, challenge: challenge });
      addJoinedChallenge({ user: challengeAuthor, challenge: challenge });
      const todaysAuthorPost = PublicPostEntityFake({
        authorId: challengeAuthor.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, participant]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      await conn.getRepository(PostEntity).insert([todaysAuthorPost]);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: todaysAuthorPost.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });

    it('should show post not hidden if post is not related to a challenge', async () => {
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const post = PublicPostEntityFake({
        authorId: user.id,
      });
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: post.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });

    it('should not show authors post is hidden if the user is not authenticated', async () => {
      const user = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([user, challengeAuthor]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const post = PublicPostEntityFake({
        authorId: challengeAuthor.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: post.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });

    it('should show post is not hidden if post is not from today', async () => {
      const user = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([user, challengeAuthor]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const post = PublicPostEntityFake({
        authorId: challengeAuthor.id,
        parentChallengeId: challenge.id,
        createdAt: new Date('2020-01-01'),
      });
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: post.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });

    it('should not show the post is hidden if timezone is not provided', async () => {
      const user = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([user, challengeAuthor]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const post = PublicPostEntityFake({
        authorId: user.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: post.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });

    it('should show post as visible if challenge author', async () => {
      const user = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([user, challengeAuthor]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const post = PublicPostEntityFake({
        authorId: user.id,
        parentChallengeId: challenge.id,
      });
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: isHiddenOnChallengeQuery,
          variables: {
            getPostInput: {
              id: post.id,
            },
          },
        });
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(false);
    });
  });
});
