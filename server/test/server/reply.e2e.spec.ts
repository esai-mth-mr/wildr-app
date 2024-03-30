import { INestApplication } from '@nestjs/common';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection, Repository } from 'typeorm';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { getChallengeParticipantsFeedId } from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import supertest from 'supertest';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { ReplyResolverModule } from '@verdzie/server/reply-resolver/reply.resolver.module';
import { getJWT } from '@verdzie/test/utils/auth';
import { CommentResolverModule } from '@verdzie/server/comment-resolver/comment.resolver.module';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { ChallengeResolverModule } from '@verdzie/server/challenge/challenge-resolver/challengeResolver.module';
import { addJoinedChallenge } from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { TIMEZONE_OFFSET_HEADER } from '@verdzie/server/request/request.constants';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';

describe('Reply', () => {
  let app: INestApplication;
  let conn: Connection;
  let replyRepo: Repository<ReplyEntity>;
  let commentRepo: Repository<CommentEntity>;
  let postRepo: Repository<PostEntity>;
  let challengeRepo: Repository<ChallengeEntity>;
  let userRepo: Repository<UserEntity>;
  let feedRepo: Repository<FeedEntity>;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        ReplyModule,
        ReplyResolverModule,
        CommentResolverModule,
        ChallengeResolverModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    replyRepo = conn.getRepository(ReplyEntity);
    commentRepo = conn.getRepository(CommentEntity);
    postRepo = conn.getRepository(PostEntity);
    challengeRepo = conn.getRepository(ChallengeEntity);
    userRepo = conn.getRepository(UserEntity);
    feedRepo = conn.getRepository(FeedEntity);
    await app.init();
  });

  const cleanDb = async () => {
    await replyRepo.delete({});
    await commentRepo.delete({});
    await postRepo.delete({});
    await challengeRepo.delete({});
    await userRepo.delete({});
    await feedRepo.delete({});
  };

  beforeEach(cleanDb);

  afterAll(async () => {
    await cleanDb();
    await app.close();
    await conn.close();
  });

  describe('addReply', () => {
    const addReplyMutation = /* GraphQL */ `
      mutation AddReply($addReplyInput: AddReplyInput!) {
        addReply(input: $addReplyInput) {
          ... on AddReplyResult {
            reply {
              id
            }
            challenge {
              authorInteractionsConnection {
                interactionCount
              }
            }
          }
        }
      }
    `;

    const getCommentRepliesQuery = /* GraphQL */ `
      query GetComment(
        $getCommentInput: GetCommentInput!
        $commentId: ID!
        $paginationInput: PaginationInput!
      ) {
        getComment(input: $getCommentInput) {
          ... on GetCommentResult {
            comment {
              id
              repliesConnection(
                commentId: $commentId
                paginationInput: $paginationInput
              ) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    const getAddReplyVariables = (commentId: string) => {
      return {
        addReplyInput: {
          commentId,
          content: {
            segments: {
              position: 0,
              segmentType: 'TEXT',
            },
            textSegments: {
              position: 0,
              text: {
                chunk: 'Hi',
                langCode: 'en',
                noSpace: true,
              },
            },
          },
          shouldBypassTrollDetection: true,
          negativeConfidenceCount: 0.0,
        },
      };
    };

    const getCommentRepliesVariables = (commentId: string) => {
      return {
        getCommentInput: {
          id: commentId,
        },
        paginationInput: {
          take: 5,
        },
        commentId,
      };
    };

    it('should add replies to a post discussion', async () => {
      const postAuthor = UserEntityFake();
      const replyAuthor = UserEntityFake();
      await userRepo.insert([postAuthor, replyAuthor]);
      const post = PostEntityFake({ author: postAuthor });
      await postRepo.insert(post);
      const comment = CommentEntityFake({
        authorId: replyAuthor.id,
        postId: post.id,
      });
      const commentReplyFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REPLY, comment.id),
      });
      await feedRepo.insert(commentReplyFeed);
      comment.replyFeedId = commentReplyFeed.id;
      await commentRepo.insert(comment);
      const createReplyResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(replyAuthor)}`)
        .send({
          query: addReplyMutation,
          variables: getAddReplyVariables(comment.id),
        });
      expect(createReplyResponse.body.data.addReply).toEqual({
        challenge: null,
        reply: {
          id: expect.any(String),
        },
      });
      const getCommentRepliesResult = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(replyAuthor)}`)
        .send({
          query: getCommentRepliesQuery,
          variables: getCommentRepliesVariables(comment.id),
        });
      expect(getCommentRepliesResult.status).toBe(200);
      expect(
        getCommentRepliesResult.body.data.getComment.comment.repliesConnection
          .edges[0].node.id
      ).toBe(createReplyResponse.body.data.addReply.reply.id);
    });

    it('should add replies to a challenge discussion', async () => {
      const challengeAuthor = UserEntityFake();
      const replyAuthor = UserEntityFake();
      await userRepo.insert([challengeAuthor, replyAuthor]);
      const challenge = ChallengeEntityFake({ author: challengeAuthor });
      await challengeRepo.insert(challenge);
      const challengeParticipantFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantFeed.page.ids = [replyAuthor.id, challengeAuthor.id];
      await feedRepo.insert(challengeParticipantFeed);
      const comment = CommentEntityFake({
        authorId: replyAuthor.id,
        challengeId: challenge.id,
      });
      comment.postId = undefined;
      const commentReplyFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REPLY, comment.id),
      });
      await feedRepo.insert(commentReplyFeed);
      comment.replyFeedId = commentReplyFeed.id;
      await commentRepo.insert(comment);
      const createReplyResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(replyAuthor)}`)
        .send({
          query: addReplyMutation,
          variables: getAddReplyVariables(comment.id),
        });
      expect(createReplyResponse.status).toBe(200);
      const getCommentRepliesResult = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(replyAuthor)}`)
        .send({
          query: getCommentRepliesQuery,
          variables: getCommentRepliesVariables(comment.id),
        });
      expect(getCommentRepliesResult.status).toBe(200);
      expect(
        getCommentRepliesResult.body.data.getComment.comment.repliesConnection
          .edges[0].node.id
      ).toBe(createReplyResponse.body.data.addReply.reply.id);
    });

    it('should update challenge authors interactions', async () => {
      const challengeAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      addJoinedChallenge({ user: challengeAuthor, challenge });
      await userRepo.insert([challengeAuthor, commentAuthor]);
      await challengeRepo.insert(challenge);
      const challengeParticipantFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantFeed.page.ids = [
        commentAuthor.id,
        challengeAuthor.id,
      ];
      challengeParticipantFeed.count = 2;
      await feedRepo.insert(challengeParticipantFeed);
      const comment = CommentEntityFake({
        authorId: commentAuthor.id,
        challengeId: challenge.id,
      });
      const commentReplyFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REPLY, comment.id),
      });
      await feedRepo.insert(commentReplyFeed);
      comment.replyFeedId = commentReplyFeed.id;
      await commentRepo.insert(comment);
      const createReplyResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: addReplyMutation,
          variables: getAddReplyVariables(comment.id),
        });
      expect(createReplyResponse.status).toBe(200);
      expect(
        createReplyResponse.body.data.addReply.challenge
          .authorInteractionsConnection.interactionCount
      ).toEqual(1);
    });
  });
});
