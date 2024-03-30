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
  PostEntityFake,
  PublicPostEntityFake,
} from '@verdzie/server/post/testing/post.fake';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  getChallengeAllPostsFeedId,
  getChallengeParticipantsFeedId,
  getChallengePinnedEntriesFeedId,
  getUserPostEntriesOnChallengeFeedId,
  toChallengeParticipantIdString,
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

  describe('createMultiMediaPost', () => {
    let clock: sinon.SinonFakeTimers;

    beforeAll(() => {
      clock = sinon.useFakeTimers({
        now: new Date(),
      });
    });

    beforeEach(async () => {
      await conn.getRepository(CommentEntity).delete({});
      await conn.getRepository(FeedEntity).delete({});
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(ChallengeEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    afterAll(async () => {
      await conn.getRepository(CommentEntity).delete({});
      await conn.getRepository(FeedEntity).delete({});
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(ChallengeEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
      clock.restore();
    });

    const createMultiMediaPostMutation = /* GraphQL */ `
      mutation CreateMultiMediaPost(
        $createMultiMediaPostInput: CreateMultiMediaPostInput!
      ) {
        createMultiMediaPost(input: $createMultiMediaPostInput) {
          __typename
          ... on CreatePostResult {
            post {
              id
            }
          }
        }
      }
    `;

    const getMultiMediaPostVariables = ({
      challengeId,
    }: {
      challengeId?: string;
    } = {}) => ({
      createMultiMediaPostInput: {
        challengeId,
        visibility: 'ALL',
        properties: [
          {
            textInput: {
              content: {
                textSegments: [
                  {
                    position: 0,
                    text: {
                      chunk: 'Bob random',
                    },
                  },
                ],
                segments: [
                  {
                    position: 0,
                    segmentType: 'TEXT',
                  },
                ],
              },
            },
          },
        ],
      },
    });

    it('should create a multimedia post related to a challenge', async () => {
      const challengeAuthor = UserEntityFake();
      const postAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
      });
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [challengeAuthor, postAuthor].map(
        u => {
          return toChallengeParticipantIdString({
            id: u.id,
          });
        }
      );
      challengeParticipantsFeed.count =
        challengeParticipantsFeed.page.ids.length;
      addJoinedChallenge({
        challenge: challenge,
        user: postAuthor,
      });
      addJoinedChallenge({
        challenge: challenge,
        user: challengeAuthor,
      });
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, postAuthor]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: createMultiMediaPostMutation,
          variables: getMultiMediaPostVariables({ challengeId: challenge.id }),
        });
      expect(response.body.data.createMultiMediaPost).toEqual({
        __typename: 'CreatePostResult',
        post: {
          id: expect.any(String),
        },
      });
      const postId = response.body.data.createMultiMediaPost.post.id;
      const post = await conn.getRepository(PostEntity).findOneOrFail(postId);
      expect(post).toMatchObject({
        id: postId,
        authorId: postAuthor.id,
      });
      const challengeEntriesFeed = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(getChallengeAllPostsFeedId(challenge.id));
      expect(challengeEntriesFeed.page.ids).toEqual([
        toChallengeParticipantPostEntryStr({
          postId: post.id,
          authorId: postAuthor.id,
          date: post.createdAt,
          hasPinned: false,
        }),
      ]);
      const updatedAuthor = await conn
        .getRepository(UserEntity)
        .findOneOrFail(postAuthor.id);
      expect(updatedAuthor.challengeContext?.joinedChallenges).toHaveLength(1);
      expect(updatedAuthor.challengeContext?.joinedChallenges).toEqual([
        toUserJoinedChallengeString({
          challengeId: challenge.id,
          authorId: challengeAuthor.id,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          latestEntryTime: post.createdAt,
          joinedAt: new Date(),
        }),
      ]);
      expect(updatedAuthor.getComputedStats()).toMatchObject({
        createdChallengesCount: 0,
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        joinedChallengesCount: 1,
        postCount: 1,
      });
    });
  });

  describe('deletePost', () => {
    beforeEach(async () => {
      await conn.getRepository(FeedEntity).delete({});
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(ChallengeEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    afterAll(async () => {
      await conn.getRepository(FeedEntity).delete({});
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(ChallengeEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    const deletePostMutation = /* GraphQL */ `
      mutation DeletePost($input: DeletePostInput!) {
        deletePost(input: $input) {
          __typename
          ... on DeletePostResult {
            post {
              id
            }
          }
        }
      }
    `;

    it('should mark the post as soft deleted', async () => {
      const currentUser = UserEntityFake();
      currentUser.setStats({ postCount: 1 });
      const post = PostEntityFake({ authorId: currentUser.id });
      await conn.getRepository(UserEntity).insert(currentUser);
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: deletePostMutation,
          variables: {
            input: {
              postId: post.id,
            },
          },
        });
      expect(response.body.data.deletePost.post.id).toBe(post.id);
      const updatedPost = await conn
        .getRepository(PostEntity)
        .findOneOrFail(post.id);
      expect(updatedPost.willBeDeleted).toBe(true);
    });

    it('should reduce the authors post count stat', async () => {
      const currentUser = UserEntityFake();
      currentUser.setStats({ postCount: 1 });
      const post = PostEntityFake({ authorId: currentUser.id });
      await conn.getRepository(UserEntity).insert(currentUser);
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(currentUser)}`)
        .send({
          query: deletePostMutation,
          variables: {
            input: {
              postId: post.id,
            },
          },
        });
      expect(response.body.data.deletePost.post.id).toBe(post.id);
      const updatedUser = await conn
        .getRepository(UserEntity)
        .findOneOrFail(currentUser.id);
      expect(updatedUser._stats?.postCount).toBe(0);
    });

    // TODO test repost operations

    // TODO test challenge cleanup call
  });

  describe('reactToPost', () => {
    const reactOnPostMutation = /* GraphQL */ `
      mutation ReactOnPost($reactOnPostInput: ReactOnPostInput!) {
        reactOnPost(input: $reactOnPostInput) {
          __typename
          ... on ReactOnPostResult {
            post {
              id
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

    it('should add a reaction to a post', async () => {
      const user = UserEntityFake();
      const user2Id = generateId();
      const user2 = UserEntityFake({
        id: user2Id,
        likeReactionOnPostFeedId: toFeedId(
          FeedEntityType.LIKE_REACTIONS_ON_POST,
          user2Id
        ),
      });
      const postId = generateId();
      const postLikeFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.LIKE_REACTIONS_ON_POST, postId),
      });
      postLikeFeed.page.ids = [];
      postLikeFeed.count = 0;
      const userLikeFeed = FeedEntityFake({
        id: user2.likeReactionOnPostFeedId,
      });
      const post = PublicPostEntityFake({
        id: postId,
        authorId: user.id,
      });
      post._stats.likeCount = 0;
      await conn.getRepository(FeedEntity).insert([postLikeFeed, userLikeFeed]);
      await conn.getRepository(UserEntity).insert([user, user2]);
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user2)}`)
        .send({
          query: reactOnPostMutation,
          variables: {
            reactOnPostInput: {
              postId: post.id,
              reaction: ReactionType.LIKE,
            },
          },
        });
      expect(response.body.data.reactOnPost.post.id).toBe(post.id);
      const updatedPost = await conn
        .getRepository(PostEntity)
        .findOneOrFail(post.id);
      expect(updatedPost.stats.likeCount).toBe('1');
    });

    it('should add a reaction to a challenge related post', async () => {
      const postAuthor = UserEntityFake();
      const challengeAuthorId = generateId();
      const challengeAuthor = UserEntityFake({
        id: challengeAuthorId,
        likeReactionOnPostFeedId: toFeedId(
          FeedEntityType.LIKE_REACTIONS_ON_POST,
          challengeAuthorId
        ),
      });
      const challengeAuthorLikeFeed = FeedEntityFake({
        id: challengeAuthor.likeReactionOnPostFeedId,
      });
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: challengeAuthor, challenge });
      addJoinedChallenge({ user: postAuthor, challenge });
      const postId = generateId();
      const post = PublicPostEntityFake({
        id: postId,
        authorId: postAuthor.id,
        parentChallengeId: challenge.id,
      });
      const postLikeFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.LIKE_REACTIONS_ON_POST, postId),
      });
      postLikeFeed.page.ids = [];
      postLikeFeed.count = 0;
      post._stats.likeCount = 0;
      await conn
        .getRepository(FeedEntity)
        .insert([postLikeFeed, challengeAuthorLikeFeed]);
      await conn
        .getRepository(UserEntity)
        .insert([postAuthor, challengeAuthor]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      await conn.getRepository(PostEntity).insert(post);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .set(TIMEZONE_OFFSET_HEADER, '+00:00')
        .send({
          query: reactOnPostMutation,
          variables: {
            reactOnPostInput: {
              postId: post.id,
              reaction: ReactionType.LIKE,
            },
          },
        });
      expect(response.body.data.reactOnPost.post.id).toBe(post.id);
      expect(response.body.data.reactOnPost.challenge.id).toBe(challenge.id);
      expect(
        response.body.data.reactOnPost.challenge.authorInteractionsConnection
          .interactionCount
      ).toBe(1);
      const updatedPost = await conn
        .getRepository(PostEntity)
        .findOneOrFail(post.id);
      expect(updatedPost.stats.likeCount).toBe('1');
    });
  });

  describe('isPinnedToChallenge', () => {
    const getPostPinnedStatusQuery = /* GraphQL */ `
      query GetPost($getPostInput: GetPostInput!) {
        getPost(input: $getPostInput) {
          ... on GetPostResult {
            post {
              isPinnedToChallenge
            }
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    const getPostPinnedStatusVariables = ({ postId }: { postId: string }) => {
      return {
        getPostInput: {
          id: postId,
        },
      };
    };

    it('should return the correct is pinned status', async () => {
      const postAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert(postAuthor);
      const challenge = ChallengeEntityFake({ authorId: postAuthor.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const post = PublicPostEntityFake({
        authorId: postAuthor.id,
        parentChallengeId: challenge.id,
      });
      await conn.getRepository(PostEntity).insert(post);
      const challengePinnedEntriesFeed = FeedEntityFake({
        id: getChallengePinnedEntriesFeedId(challenge.id),
      });
      challengePinnedEntriesFeed.page.ids = [
        toChallengeParticipantPostEntryStr({
          postId: post.id,
          authorId: postAuthor.id,
          date: post.createdAt,
          hasPinned: true,
        }),
      ];
      await conn.getRepository(FeedEntity).insert(challengePinnedEntriesFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getPostPinnedStatusQuery,
          variables: getPostPinnedStatusVariables({
            postId: post.id,
          }),
        });
      expect(response.body.data.getPost.post.isPinnedToChallenge).toBe(true);
      challengePinnedEntriesFeed.page.ids = [];
      await conn
        .getRepository(FeedEntity)
        .update(challengePinnedEntriesFeed.id, challengePinnedEntriesFeed);
      const response2 = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getPostPinnedStatusQuery,
          variables: getPostPinnedStatusVariables({
            postId: post.id,
          }),
        });
      expect(response2.body.data.getPost.post.isPinnedToChallenge).toBe(false);
    });
  });

  describe('repostAccessControlContext', () => {
    const repostAccessControlQuery = /* GraphQL */ `
      query GetPost($getPostInput: GetPostInput!) {
        getPost(input: $getPostInput) {
          ... on GetPostResult {
            post {
              repostAccessControlContext {
                canRepost
                hasReposted
                cannotRepostErrorMessage
              }
            }
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    it('should allow reposts of posts related to a challenge', async () => {
      const originalCreator = UserEntityFake();
      const repostCreator = UserEntityFake();
      const challengeCreator = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([originalCreator, repostCreator, challengeCreator]);
      const challenge = ChallengeEntityFake({ authorId: challengeCreator.id });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const originalPost = PublicPostEntityFake({
        authorId: originalCreator.id,
        parentChallengeId: challenge.id,
      });
      await conn.getRepository(PostEntity).insert(originalPost);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(repostCreator)}`)
        .send({
          query: repostAccessControlQuery,
          variables: {
            getPostInput: {
              id: originalPost.id,
            },
          },
        });
      expect(
        response.body.data.getPost.post.repostAccessControlContext
      ).toEqual({
        canRepost: true,
        hasReposted: false,
        cannotRepostErrorMessage: null,
      });
    });
  });

  describe('repost', () => {
    const repostMutation = /* GraphQL */ `
      mutation Repost($repostInput: RepostInput!) {
        repost(input: $repostInput) {
          ... on SmartError {
            message
          }
          ... on TrollDetectorError {
            message
            data
            indices
          }
          ... on RepostResult {
            __typename
            post {
              __typename
              id
              author {
                handle
              }
            }
          }
        }
      }
    `;

    const getRepostInput = (
      overrides: Partial<RepostInput> = {}
    ): RepostInput => {
      return {
        postId: '',
        caption: {
          segments: [],
        },
        ...overrides,
      };
    };

    it('should allow reposting of posts related to a challenge', async () => {
      const originalCreator = UserEntityFake();
      const repostCreator = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      addJoinedChallenge({ user: repostCreator, challenge });
      await conn
        .getRepository(UserEntity)
        .insert([originalCreator, repostCreator, challengeAuthor]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const originalPost = PublicPostEntityFake({
        authorId: originalCreator.id,
        parentChallengeId: challenge.id,
      });
      await conn.getRepository(PostEntity).insert(originalPost);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(repostCreator)}`)
        .send({
          query: repostMutation,
          variables: {
            repostInput: getRepostInput({ postId: originalPost.id }),
          },
        });
      expect(response.body.data.repost.post.author.handle).toBe(
        repostCreator.handle
      );
      const repost = response.body.data.repost.post;
      const foundRepost = await conn.getRepository(PostEntity).findOneOrFail({
        id: repost.id,
      });
      expect(foundRepost.parentChallengeId).toBe(challenge.id);
      expect(foundRepost.authorId).toBe(repostCreator.id);
      expect(foundRepost.isRepost()).toBe(true);
    });

    it('should allow users who have not joined the challenge to repost challenge posts', async () => {
      const originalCreator = UserEntityFake();
      const repostCreator = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      const originalPost = PublicPostEntityFake({
        authorId: originalCreator.id,
        parentChallengeId: challenge.id,
      });
      await conn
        .getRepository(UserEntity)
        .insert([originalCreator, repostCreator, challengeAuthor]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      await conn.getRepository(PostEntity).insert(originalPost);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(repostCreator)}`)
        .send({
          query: repostMutation,
          variables: {
            repostInput: getRepostInput({ postId: originalPost.id }),
          },
        });
      expect(response.body.data.repost.post.author.handle).toBe(
        repostCreator.handle
      );
      const repost = response.body.data.repost.post;
      const foundRepost = await conn.getRepository(PostEntity).findOneOrFail({
        id: repost.id,
      });
      expect(foundRepost.parentChallengeId).toBe(challenge.id);
      expect(foundRepost.authorId).toBe(repostCreator.id);
      expect(foundRepost.isRepost()).toBe(true);
    });
  });

  describe('isHiddenOnChallenge', () => {
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

    it('should show authors post as hidden if user has no entries today', async () => {
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
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(true);
    });

    it('should show authors post is not hidden if user has entry today', async () => {
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

    it('should show authors post is hidden if user has no entries', async () => {
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
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(true);
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

    it('should show authors post is hidden if the user is not authenticated', async () => {
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
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(true);
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

    it('should show the post is hidden if timezone is not provided', async () => {
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
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(true);
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
      expect(response.body.data.getPost.post.isHiddenOnChallenge).toBe(true);
    });
  });

  describe('commentsConnection', () => {
    const postCommentsConnectionQuery = /* GraphQL */ `
      query PostWithComments(
        $input: GetPostInput!
        $postId: ID!
        $first: Int!
        $after: String
      ) {
        getPost(input: $input) {
          ... on GetPostResult {
            post {
              commentsConnection(
                postId: $postId
                first: $first
                after: $after
              ) {
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
                    id
                  }
                }
              }
            }
          }
        }
      }
    `;

    it('should paginate through comments in reverse chronological order', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const post = PublicPostEntityFake({
        authorId: postAuthor.id,
      });
      const comments = Array.from({ length: 10 }, () => {
        return CommentEntityFake({
          authorId: commentAuthor.id,
          postId: post.id,
        });
      });
      const postCommentsFeed = FeedEntityFake({
        id: post.commentFeedId,
      });
      postCommentsFeed.page.ids = comments.map(
        comment => commentAuthor.id + ID_SEPARATOR + comment.id
      );
      await conn.getRepository(UserEntity).insert([postAuthor, commentAuthor]);
      await conn.getRepository(PostEntity).insert(post);
      await conn.getRepository(CommentEntity).insert(comments);
      await conn.getRepository(FeedEntity).insert(postCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: postCommentsConnectionQuery,
          variables: {
            input: {
              id: post.id,
            },
            postId: post.id,
            first: 6,
          },
        });
      expect(
        response.body.data.getPost.post.commentsConnection.edges
      ).toHaveLength(6);
      const returnedCommentIds =
        response.body.data.getPost.post.commentsConnection.edges.map(
          (edge: any) => edge.node.id
        );
      const expectedCommentIds = comments.slice(0, 6).map(c => c.id);
      expect(returnedCommentIds).toEqual(expectedCommentIds);
      const response2 = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: postCommentsConnectionQuery,
          variables: {
            input: {
              id: post.id,
            },
            postId: post.id,
            first: 6,
            after:
              response.body.data.getPost.post.commentsConnection.pageInfo
                .endCursor,
          },
        });
      expect(
        response2.body.data.getPost.post.commentsConnection.edges
      ).toHaveLength(4);
      const returnedCommentIds2 =
        response2.body.data.getPost.post.commentsConnection.edges.map(
          (edge: any) => edge.node.id
        );
      const expectedCommentIds2 = comments.slice(6, 10).map(c => c.id);
      expect(returnedCommentIds2).toEqual(expectedCommentIds2);
    });

    it('should show comments to comment author when access is AUTHOR', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const post = PublicPostEntityFake({
        authorId: postAuthor.id,
      });
      // @ts-expect-error
      post.accessControl.commentVisibilityAccessData = {
        access: CommentVisibilityAccess.AUTHOR,
      };
      const comments = [
        CommentEntityFake({
          authorId: commentAuthor.id,
          postId: post.id,
        }),
      ];
      const postCommentsFeed = FeedEntityFake({
        id: post.commentFeedId,
      });
      postCommentsFeed.page.ids = comments
        .map(comment => commentAuthor.id + ID_SEPARATOR + comment.id)
        .reverse();
      await conn.getRepository(UserEntity).insert([postAuthor, commentAuthor]);
      await conn.getRepository(PostEntity).insert(post);
      await conn.getRepository(CommentEntity).insert(comments);
      await conn.getRepository(FeedEntity).insert(postCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set({ Authorization: `Bearer ${getJWT(commentAuthor)}` })
        .send({
          query: postCommentsConnectionQuery,
          variables: {
            input: {
              id: post.id,
            },
            postId: post.id,
            first: 6,
          },
        });
      expect(
        response.body.data.getPost.post.commentsConnection.edges
      ).toHaveLength(1);
    });

    it('should show comments to post author when access is AUTHOR', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const post = PublicPostEntityFake({
        authorId: postAuthor.id,
      });
      // @ts-expect-error
      post.accessControl.commentVisibilityAccessData = {
        access: CommentVisibilityAccess.AUTHOR,
      };
      const comments = [
        CommentEntityFake({
          authorId: commentAuthor.id,
          postId: post.id,
        }),
      ];
      const postCommentsFeed = FeedEntityFake({
        id: post.commentFeedId,
      });
      postCommentsFeed.page.ids = comments
        .map(comment => commentAuthor.id + ID_SEPARATOR + comment.id)
        .reverse();
      await conn.getRepository(UserEntity).insert([postAuthor, commentAuthor]);
      await conn.getRepository(PostEntity).insert(post);
      await conn.getRepository(CommentEntity).insert(comments);
      await conn.getRepository(FeedEntity).insert(postCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set({ Authorization: `Bearer ${getJWT(postAuthor)}` })
        .send({
          query: postCommentsConnectionQuery,
          variables: {
            input: {
              id: post.id,
            },
            postId: post.id,
            first: 6,
          },
        });
      expect(
        response.body.data.getPost.post.commentsConnection.edges
      ).toHaveLength(1);
    });

    it('should not show comments to other users when access is AUTHOR', async () => {
      const postAuthor = UserEntityFake();
      const commentAuthor = UserEntityFake();
      const otherUser = UserEntityFake();
      const post = PublicPostEntityFake({
        authorId: postAuthor.id,
      });
      // @ts-expect-error
      post.accessControl.commentVisibilityAccessData = {
        access: CommentVisibilityAccess.AUTHOR,
      };
      const comments = [
        CommentEntityFake({
          authorId: commentAuthor.id,
          postId: post.id,
        }),
      ];
      const postCommentsFeed = FeedEntityFake({
        id: post.commentFeedId,
      });
      postCommentsFeed.page.ids = comments
        .map(comment => commentAuthor.id + ID_SEPARATOR + comment.id)
        .reverse();
      await conn
        .getRepository(UserEntity)
        .insert([postAuthor, commentAuthor, otherUser]);
      await conn.getRepository(PostEntity).insert(post);
      await conn.getRepository(CommentEntity).insert(comments);
      await conn.getRepository(FeedEntity).insert(postCommentsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set({ Authorization: `Bearer ${getJWT(otherUser)}` })
        .send({
          query: postCommentsConnectionQuery,
          variables: {
            input: {
              id: post.id,
            },
            postId: post.id,
            first: 6,
          },
        });
      expect(
        response.body.data.getPost.post.commentsConnection.edges
      ).toHaveLength(0);
    });

    // TODO test other access control types
    // TODO test comment data
  });
});
