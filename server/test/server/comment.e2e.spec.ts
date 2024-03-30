import { INestApplication } from '@nestjs/common';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { CommentResolverModule } from '@verdzie/server/comment-resolver/comment.resolver.module';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection, Repository } from 'typeorm';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { ReactionType } from '@verdzie/server/generated-graphql';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  getChallengeParticipantsFeedId,
  toChallengeParticipantIdString,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import supertest from 'supertest';
import { getJWT } from '@verdzie/test/utils/auth';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PublicPostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { ChallengeResolverModule } from '@verdzie/server/challenge/challenge-resolver/challengeResolver.module';
import { addJoinedChallenge } from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { TIMEZONE_OFFSET_HEADER } from '@verdzie/server/request/request.constants';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { ReplyEntityFake } from '@verdzie/server/reply/testing/reply-entity.fake';
import exp from 'constants';
import { CommentVisibilityAccess } from '@verdzie/server/post/postAccessControl';

describe('Comment', () => {
  let app: INestApplication;
  let conn: Connection;
  let postRepo: Repository<PostEntity>;
  let feedRepo: Repository<FeedEntity>;
  let commentRepo: Repository<CommentEntity>;
  let challengeRepo: Repository<ChallengeEntity>;
  let userRepo: Repository<UserEntity>;
  let replyRepo: Repository<ReplyEntity>;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        ChallengeResolverModule,
        CommentResolverModule,
        CommentModule,
      ],
    });
    app = module.createNestApplication();
    await app.init();
    conn = await getTestConnection();
    postRepo = conn.getRepository(PostEntity);
    feedRepo = conn.getRepository(FeedEntity);
    commentRepo = conn.getRepository(CommentEntity);
    challengeRepo = conn.getRepository(ChallengeEntity);
    replyRepo = conn.getRepository(ReplyEntity);
    userRepo = conn.getRepository(UserEntity);
  });

  const cleanDb = async () => {
    await replyRepo.delete({});
    await commentRepo.delete({});
    await postRepo.delete({});
    await challengeRepo.delete({});
    await userRepo.delete({});
    await feedRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await app.close();
    await conn.close();
  });

  describe('addComment', () => {
    const addCommentMutation = /* GraphQL */ `
      mutation AddComment($addCommentInput: AddCommentInput!) {
        addComment(input: $addCommentInput) {
          ... on AddCommentResult {
            comment {
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

    const getAddCommentVariables = ({
      postId,
      challengeId,
    }: {
      postId?: string;
      challengeId?: string;
    }) => {
      return {
        addCommentInput: {
          ...(postId ? { postId } : { challengeId }),
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
          participationType: 'OPEN',
          shouldBypassTrollDetection: true,
          negativeConfidenceCount: 0.0,
        },
      };
    };

    it('should add a comment to a post', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([postAuthor, commentAuthor]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(commentAuthor)}`)
        .send({
          query: addCommentMutation,
          variables: getAddCommentVariables({
            postId: post.id,
          }),
        });
      expect(response.body.data.addComment.comment).toBeDefined();
    });

    it('should add a comment to a challenge', async () => {
      const challengeAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, commentAuthor]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor, commentAuthor].map(
        p => {
          return toChallengeParticipantIdString({
            id: p.id,
          });
        }
      );
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(commentAuthor)}`)
        .send({
          query: addCommentMutation,
          variables: getAddCommentVariables({
            challengeId: challenge.id,
          }),
        });
      expect(response.body.data.addComment.comment).toBeDefined();
    });

    it('should update the challenge authors interaction count', async () => {
      const challengeAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: challengeAuthor, challenge });
      await conn.getRepository(UserEntity).insert(challengeAuthor);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor].map(p => {
        return toChallengeParticipantIdString({
          id: p.id,
        });
      });
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: addCommentMutation,
          variables: getAddCommentVariables({
            challengeId: challenge.id,
          }),
        });
      expect(response.body.data.addComment.comment).toBeDefined();
      expect(
        response.body.data.addComment.challenge.authorInteractionsConnection
          .interactionCount
      ).toEqual(1);
    });
  });

  describe('reactOnComment', () => {
    const reactOnCommentMutation = /* GraphQL */ `
      mutation ReactToComment($reactOnCommentInput: ReactOnCommentInput!) {
        reactOnComment(input: $reactOnCommentInput) {
          ... on ReactOnCommentResult {
            comment {
              id
              commentContext {
                liked
              }
              commentStats {
                likeCount
              }
            }
            challenge {
              id
              authorInteractionsConnection {
                interactionCount
              }
            }
          }
        }
      }
    `;

    it('should allow users to react to challenge comments', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([postAuthor, commentAuthor]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: commentAuthor.id,
      });
      await conn.getRepository(CommentEntity).insert(comment);
      const postCommentsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.COMMENT, post.id),
      });
      postCommentsFeed.page.ids = [comment.id];
      postCommentsFeed.count = 1;
      await conn.getRepository(FeedEntity).insert(postCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(commentAuthor)}`)
        .send({
          query: reactOnCommentMutation,
          variables: {
            reactOnCommentInput: {
              commentId: comment.id,
              reaction: ReactionType.LIKE,
            },
          },
        });
      expect(response.body.data.reactOnComment.comment.id).toEqual(comment.id);
      expect(
        response.body.data.reactOnComment.comment.commentContext.liked
      ).toEqual(true);
      expect(
        response.body.data.reactOnComment.comment.commentStats.likeCount
      ).toEqual(1);
    });

    it('should update the challenge authors interaction count', async () => {
      const challengeAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: challengeAuthor, challenge });
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, commentAuthor]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor, commentAuthor].map(
        p => {
          return toChallengeParticipantIdString({
            id: p.id,
          });
        }
      );
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const comment = CommentEntityFake({
        challengeId: challenge.id,
        authorId: commentAuthor.id,
      });
      await conn.getRepository(CommentEntity).insert(comment);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: reactOnCommentMutation,
          variables: {
            reactOnCommentInput: {
              commentId: comment.id,
              reaction: ReactionType.LIKE,
            },
          },
        });
      expect(response.body.data.reactOnComment.comment.id).toEqual(comment.id);
      expect(
        response.body.data.reactOnComment.comment.commentContext.liked
      ).toEqual(true);
      expect(
        response.body.data.reactOnComment.comment.commentStats.likeCount
      ).toEqual(1);
      expect(
        response.body.data.reactOnComment.challenge.authorInteractionsConnection
          .interactionCount
      ).toEqual(1);
    });
  });

  describe('flagComment', () => {
    const flagCommentMutation = /* GraphQL */ `
      mutation FlagComment($flagCommentInput: FlagCommentInput!) {
        flagComment(input: $flagCommentInput) {
          ... on FlagCommentResult {
            comment {
              id
              author {
                id
              }
            }
          }
        }
      }
    `;

    it('should flag a comment on a challenge', async () => {
      const challengeAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: challengeAuthor, challenge });
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, commentAuthor]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor, commentAuthor].map(
        p => {
          return toChallengeParticipantIdString({
            id: p.id,
          });
        }
      );
      challengeParticipantsFeed.count = 2;
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const comment = CommentEntityFake({
        challengeId: challenge.id,
        authorId: commentAuthor.id,
      });
      await conn.getRepository(CommentEntity).insert(comment);
      const challengeCommentsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.COMMENT, challenge.id),
      });
      challengeCommentsFeed.page.ids = [comment.id];
      challengeCommentsFeed.count = 1;
      await conn.getRepository(FeedEntity).insert(challengeCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: flagCommentMutation,
          variables: {
            flagCommentInput: {
              commentId: comment.id,
              operation: 'FLAG',
            },
          },
        });
      expect(response.body.data.flagComment.comment.id).toEqual(comment.id);
      const updatedChallenge = await conn
        .getRepository(ChallengeEntity)
        .findOne(challenge.id);
      expect(updatedChallenge?.stats.hasHiddenComments).toEqual(true);
      const updatedComment = await conn
        .getRepository(CommentEntity)
        .findOne(comment.id);
      expect(updatedComment?.flagMeta?.flags).toHaveLength(1);
    });

    it('should un flag a comment on a challenge', async () => {
      const challengeAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: challengeAuthor, challenge });
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, commentAuthor]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor, commentAuthor].map(
        p => {
          return toChallengeParticipantIdString({
            id: p.id,
          });
        }
      );
      challengeParticipantsFeed.count = 2;
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const comment = CommentEntityFake({
        challengeId: challenge.id,
        authorId: commentAuthor.id,
      });
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: challengeAuthor.id,
            flaggedAt: new Date(),
          },
        ],
      };
      await conn.getRepository(CommentEntity).insert(comment);
      const challengeCommentsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.COMMENT, challenge.id),
      });
      challengeCommentsFeed.page.ids = [comment.id];
      challengeCommentsFeed.count = 1;
      await conn.getRepository(FeedEntity).insert(challengeCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: flagCommentMutation,
          variables: {
            flagCommentInput: {
              commentId: comment.id,
              operation: 'UN_FLAG',
            },
          },
        });
      expect(response.body.data.flagComment.comment.id).toEqual(comment.id);
      const updatedComment = await conn
        .getRepository(CommentEntity)
        .findOne(comment.id);
      expect(updatedComment?.flagMeta?.flags).toHaveLength(0);
    });

    it('should flag a comment on a post', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([postAuthor, commentAuthor]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: commentAuthor.id,
      });
      await conn.getRepository(CommentEntity).insert(comment);
      const postCommentsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.COMMENT, post.id),
      });
      postCommentsFeed.page.ids = [comment.id];
      postCommentsFeed.count = 1;
      await conn.getRepository(FeedEntity).insert(postCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: flagCommentMutation,
          variables: {
            flagCommentInput: {
              commentId: comment.id,
              operation: 'FLAG',
            },
          },
        });
      expect(response.body.data.flagComment.comment.id).toEqual(comment.id);
      const updatedPost = await conn.getRepository(PostEntity).findOne(post.id);
      expect(updatedPost?.stats.hasHiddenComments).toEqual(true);
      const updatedComment = await conn
        .getRepository(CommentEntity)
        .findOne(comment.id);
      expect(updatedComment?.flagMeta?.flags).toHaveLength(1);
    });

    it('should un flag a comment on a post', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([postAuthor, commentAuthor]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(PostEntity).insert(post);
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: commentAuthor.id,
      });
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: postAuthor.id,
            flaggedAt: new Date(),
          },
        ],
      };
      await conn.getRepository(CommentEntity).insert(comment);
      const postCommentsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.COMMENT, post.id),
      });
      postCommentsFeed.page.ids = [comment.id];
      postCommentsFeed.count = 1;
      await conn.getRepository(FeedEntity).insert(postCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: flagCommentMutation,
          variables: {
            flagCommentInput: {
              commentId: comment.id,
              operation: 'UN_FLAG',
            },
          },
        });
      expect(response.body.data.flagComment.comment.id).toEqual(comment.id);
      const updatedComment = await conn
        .getRepository(CommentEntity)
        .findOne(comment.id);
      expect(updatedComment?.flagMeta?.flags).toHaveLength(0);
    });
  });

  describe('repliesConnection', () => {
    const getCommentRepliesQuery = /* GraphQL */ `
      query GetCommentReplies(
        $commentId: ID!
        $input: GetCommentInput!
        $first: Int
        $after: String
      ) {
        getComment(input: $input) {
          ... on GetCommentResult {
            comment {
              id
              repliesConnection(
                commentId: $commentId
                first: $first
                after: $after
              ) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
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

    it('should return the replies for a comment', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const replyAuthor1 = UserEntityFake();
      const replyAuthor2 = UserEntityFake();
      await userRepo.insert([
        postAuthor,
        commentAuthor,
        replyAuthor1,
        replyAuthor2,
      ]);
      const post = PublicPostEntityFake({ authorId: postAuthor.id });
      await postRepo.insert(post);
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: commentAuthor.id,
      });
      await commentRepo.insert(comment);
      const replies = Array.from({ length: 10 }).map((_, i) => {
        return ReplyEntityFake({
          commentId: comment.id,
          authorId: i % 2 === 0 ? replyAuthor1.id : replyAuthor2.id,
        });
      });
      await replyRepo.insert(replies);
      const commentRepliesFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REPLY, comment.id),
      });
      replies.forEach(reply => commentRepliesFeed.tryUnshiftEntry(reply.id));
      await feedRepo.insert(commentRepliesFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getCommentRepliesQuery,
          variables: {
            commentId: comment.id,
            input: {
              id: comment.id,
            },
            first: 6,
          },
        });
      expect(
        response.body.data.getComment.comment.repliesConnection.edges
      ).toHaveLength(6);
      const expectedIds = replies.slice(0, 6).map(r => r.id);
      const actualIds =
        response.body.data.getComment.comment.repliesConnection.edges.map(
          (e: any) => e.node.id
        );
      expect(actualIds).toEqual(expectedIds);
      const pageInfo =
        response.body.data.getComment.comment.repliesConnection.pageInfo;
      expect(pageInfo.hasNextPage).toEqual(true);
      expect(pageInfo.endCursor).toEqual(expectedIds[5]);
      const response2 = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getCommentRepliesQuery,
          variables: {
            commentId: comment.id,
            input: {
              id: comment.id,
            },
            first: 6,
            after: pageInfo.endCursor,
          },
        });
      expect(
        response2.body.data.getComment.comment.repliesConnection.edges
      ).toHaveLength(4);
      const expectedIds2 = replies.slice(6, 10).map(r => r.id);
      const actualIds2 =
        response2.body.data.getComment.comment.repliesConnection.edges.map(
          (e: any) => e.node.id
        );
      expect(actualIds2).toEqual(expectedIds2);
      const pageInfo2 =
        response2.body.data.getComment.comment.repliesConnection.pageInfo;
      expect(pageInfo2.hasNextPage).toEqual(false);
      expect(pageInfo2.endCursor).toEqual(expectedIds2[3]);
    });

    it('should show replies to comment author when post access is AUTHOR', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      await userRepo.insert([postAuthor, commentAuthor]);
      const post = PublicPostEntityFake({
        authorId: postAuthor.id,
      });
      // @ts-ignore
      post.accessControl = {
        commentVisibilityAccessData: {
          access: CommentVisibilityAccess.AUTHOR,
        },
      };
      await postRepo.insert(post);
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: commentAuthor.id,
      });
      await commentRepo.insert(comment);
      const replies = Array.from({ length: 10 }).map((_, i) => {
        return ReplyEntityFake({
          commentId: comment.id,
          authorId: i % 2 === 0 ? postAuthor.id : commentAuthor.id,
        });
      });
      await replyRepo.insert(replies);
      const commentRepliesFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REPLY, comment.id),
      });
      replies.forEach(reply => commentRepliesFeed.tryUnshiftEntry(reply.id));
      await feedRepo.insert(commentRepliesFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(commentAuthor)}`)
        .send({
          query: getCommentRepliesQuery,
          variables: {
            commentId: comment.id,
            input: {
              id: comment.id,
            },
            first: 6,
          },
        });
      expect(
        response.body.data.getComment.comment.repliesConnection.edges
      ).toHaveLength(6);
    });

    it('should show replies to post author when post access is AUTHOR', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      await userRepo.insert([postAuthor, commentAuthor]);
      const post = PublicPostEntityFake({
        authorId: postAuthor.id,
      });
      // @ts-ignore
      post.accessControl = {
        commentVisibilityAccessData: {
          access: CommentVisibilityAccess.AUTHOR,
        },
      };
      await postRepo.insert(post);
      const comment = CommentEntityFake({
        postId: post.id,
        authorId: commentAuthor.id,
      });
      await commentRepo.insert(comment);
      const replies = Array.from({ length: 10 }).map((_, i) => {
        return ReplyEntityFake({
          commentId: comment.id,
          authorId: i % 2 === 0 ? commentAuthor.id : postAuthor.id,
        });
      });
      await replyRepo.insert(replies);
      const commentRepliesFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REPLY, comment.id),
      });
      replies.forEach(reply => commentRepliesFeed.tryUnshiftEntry(reply.id));
      await feedRepo.insert(commentRepliesFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(commentAuthor)}`)
        .send({
          query: getCommentRepliesQuery,
          variables: {
            commentId: comment.id,
            input: {
              id: comment.id,
            },
            first: 6,
          },
        });
      expect(
        response.body.data.getComment.comment.repliesConnection.edges
      ).toHaveLength(6);
    });
  });
});
