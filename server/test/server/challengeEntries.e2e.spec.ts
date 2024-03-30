import { INestApplication } from '@nestjs/common';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection, Repository } from 'typeorm';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  getChallengeAllPostsFeedId,
  getChallengeFeaturedPostsFeedId,
  getUserPostEntriesOnChallengeFeedId,
  toChallengeParticipantPostEntryStr,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import supertest from 'supertest';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { ChallengeResolverModule } from '@verdzie/server/challenge/challenge-resolver/challengeResolver.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { first, last } from 'lodash';
import { getJWT } from '@verdzie/test/utils/auth';
import { PaginationOrder } from '@verdzie/server/generated-graphql';
import { ChallengeEntriesResolverModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries-resolver.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';

describe('ChallengeEntries', () => {
  let app: INestApplication;
  let conn: Connection;
  let userRepo: Repository<UserEntity>;
  let challengeRepo: Repository<ChallengeEntity>;
  let postRepo: Repository<PostEntity>;
  let commentRepo: Repository<CommentEntity>;
  let feedRepo: Repository<FeedEntity>;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        ChallengeEntriesResolverModule,
        ChallengeResolverModule,
        ChallengeModule,
        AuthModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    await conn.synchronize(true);
    userRepo = conn.getRepository(UserEntity);
    challengeRepo = conn.getRepository(ChallengeEntity);
    postRepo = conn.getRepository(PostEntity);
    commentRepo = conn.getRepository(CommentEntity);
    feedRepo = conn.getRepository(FeedEntity);
    await app.init();
  });

  const cleanDb = async () => {
    await commentRepo.delete({});
    await postRepo.delete({});
    await challengeRepo.delete({});
    await feedRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(cleanDb);

  afterAll(async () => {
    await cleanDb();
    await app.close();
    await conn.close();
  });

  describe('allEntriesConnection', () => {
    it(`should paginate through challenge entries`, async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const challengeParticipants = Array.from({ length: 10 }, () =>
        UserEntityFake()
      );
      await userRepo.insert(challengeParticipants);
      const posts = [];
      for (const participant of challengeParticipants) {
        posts.push(
          PostEntityFake({
            authorId: participant.id,
            parentChallengeId: challenge.id,
          })
        );
      }
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getChallengeAllPostsFeedId(challenge.id),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const getChallengeAllEntriesQuery = /* GraphQL */ `
        query GetAllChallengeEntries(
          $getChallengeInput: GetChallengeInput!
          $challengeId: ID!
          $paginationInput: PaginationInput!
        ) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                allEntriesConnection(
                  challengeId: $challengeId
                  paginationInput: $paginationInput
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
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeAllEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge.allEntriesConnection
          .edges;
      for (let i = 0; i < firstPageEdges.length; i++) {
        const edge = firstPageEdges[i];
        expect(edge.node.id).toBe(posts[posts.length - 1 - i].id);
      }
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge.allEntriesConnection
          .pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: posts[posts.length - 6].id,
        startCursor: last(posts)?.id,
        count: 6,
        totalCount: 10,
      });
      // Second page
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeAllEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              after: firstPageInfo.endCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .allEntriesConnection;
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge.allEntriesConnection
          .pageInfo;
      expect(secondPageEdges.edges.length).toBe(4);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: first(posts)?.id,
        startCursor: posts[posts.length - 7].id,
        count: 4,
        totalCount: 10,
      });
    });

    it(`should handle deleted posts`, async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const challengeParticipants = Array.from({ length: 10 }, () =>
        UserEntityFake()
      );
      await userRepo.insert(challengeParticipants);
      const livePosts = [];
      for (const participant of challengeParticipants) {
        livePosts.push(
          PostEntityFake({
            authorId: participant.id,
            parentChallengeId: challenge.id,
          })
        );
      }
      const deletedPost = PostEntityFake({
        authorId: challengeParticipants[0].id,
        parentChallengeId: challenge.id,
        willBeDeleted: true,
      });
      await postRepo.insert(livePosts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getChallengeAllPostsFeedId(challenge.id),
        page: {
          ids: [deletedPost, ...livePosts].map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const getChallengeAllEntriesQuery = /* GraphQL */ `
        query GetAllChallengeEntries(
          $getChallengeInput: GetChallengeInput!
          $challengeId: ID!
          $paginationInput: PaginationInput!
        ) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                allEntriesConnection(
                  challengeId: $challengeId
                  paginationInput: $paginationInput
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
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeAllEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge.allEntriesConnection
          .edges;
      for (let i = 0; i < firstPageEdges.length; i++) {
        const edge = firstPageEdges[i];
        expect(edge.node.id).toBe(livePosts[livePosts.length - 1 - i].id);
      }
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge.allEntriesConnection
          .pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: livePosts[livePosts.length - 6].id,
        startCursor: last(livePosts)?.id,
        count: 6,
        totalCount: 11,
      });
    });
  });

  describe('featuredEntriesConnection', () => {
    const getChallengeFeaturedEntriesQuery = /* GraphQL */ `
      query GetFeaturedChallengeEntries(
        $getChallengeInput: GetChallengeInput!
        $challengeId: ID!
        $paginationInput: PaginationInput!
      ) {
        getChallenge(input: $getChallengeInput) {
          ... on GetChallengeResult {
            challenge {
              featuredEntriesConnection(
                challengeId: $challengeId
                paginationInput: $paginationInput
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

    it('should paginate through featured entries', async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const challengeParticipants = Array.from({ length: 12 }, () =>
        UserEntityFake()
      );
      await userRepo.insert(challengeParticipants);
      const posts = [];
      for (const participant of challengeParticipants) {
        posts.push(
          PostEntityFake({
            authorId: participant.id,
            parentChallengeId: challenge.id,
          })
        );
      }
      await postRepo.insert(posts);
      const challengeFeaturedEntriesFeed = FeedEntityFake({
        id: getChallengeFeaturedPostsFeedId(challenge.id),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeFeaturedEntriesFeed);
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeFeaturedEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge
          .featuredEntriesConnection.edges;
      for (let i = 0; i < firstPageEdges.length; i++) {
        const edge = firstPageEdges[i];
        expect(edge.node.id).toBe(posts[posts.length - 1 - i].id);
      }
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge
          .featuredEntriesConnection.pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: posts[posts.length - 6].id,
        startCursor: last(posts)?.id,
        count: 6,
        totalCount: 12,
      });
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeFeaturedEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              after: firstPageInfo.endCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .featuredEntriesConnection.edges;
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge
          .featuredEntriesConnection.pageInfo;
      expect(secondPageEdges.length).toBe(6);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: first(posts)?.id,
        startCursor: posts[posts.length - 7].id,
        count: 6,
        totalCount: 12,
      });
    });
  });

  describe('todayEntriesConnection', () => {
    const getChallengeTodayEntriesQuery = /* GraphQL */ `
      query GetTodayChallengeEntries(
        $getChallengeInput: GetChallengeInput!
        $challengeId: ID!
        $paginationInput: PaginationInput!
      ) {
        getChallenge(input: $getChallengeInput) {
          ... on GetChallengeResult {
            challenge {
              todayEntriesConnection(
                challengeId: $challengeId
                paginationInput: $paginationInput
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
                  node {
                    id
                    isHiddenOnChallenge
                  }
                }
              }
            }
          }
        }
      }
    `;

    it('should paginate through todays entries', async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const challengeParticipants = Array.from({ length: 12 }, () =>
        UserEntityFake()
      );
      await userRepo.insert(challengeParticipants);
      const posts = [];
      for (let i = 0; i < challengeParticipants.length; i++) {
        const participant = challengeParticipants[i];
        if (i < 2) {
          posts.push(
            PostEntityFake({
              authorId: participant.id,
              parentChallengeId: challenge.id,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
            })
          );
        } else {
          posts.push(
            PostEntityFake({
              authorId: participant.id,
              parentChallengeId: challenge.id,
              createdAt: new Date(),
            })
          );
        }
      }
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getChallengeAllPostsFeedId(challenge.id),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeTodayEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.edges;
      for (let i = 0; i < firstPageEdges.length; i++) {
        const edge = firstPageEdges[i];
        expect(edge.node.id).toBe(posts[posts.length - 1 - i].id);
      }
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: posts[posts.length - 6].id,
        startCursor: last(posts)?.id,
        count: 6,
        totalCount: 10,
      });
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeTodayEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              after: firstPageInfo.endCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.edges;
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.pageInfo;
      expect(secondPageEdges.length).toBe(4);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: posts[2].id,
        startCursor: posts[posts.length - 7].id,
        count: 4,
        totalCount: 10,
      });
    });

    it('should paginate through todays entries with some authors posts at the front', async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const challengeParticipants = Array.from({ length: 8 }, () =>
        UserEntityFake()
      );
      await userRepo.insert(challengeParticipants);
      const posts: PostEntity[] = [];
      const firstThreeExpiredParticipantPosts = Array.from(
        { length: 3 },
        (_, i) => {
          return PostEntityFake({
            authorId: challengeParticipants[i].id,
            parentChallengeId: challenge.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          });
        }
      );
      posts.push(...firstThreeExpiredParticipantPosts);
      posts.push(
        PostEntityFake({
          authorId: challengeAuthor.id,
          parentChallengeId: challenge.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        })
      );
      const nextFourParticipantPosts = Array.from({ length: 4 }, (_, i) => {
        return PostEntityFake({
          authorId: challengeParticipants[i].id,
          parentChallengeId: challenge.id,
          createdAt: new Date(),
        });
      });
      posts.push(...nextFourParticipantPosts.slice().reverse());
      const firstAuthorPost = PostEntityFake({
        authorId: challengeAuthor.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      posts.push(firstAuthorPost);
      // 3 participants posts
      const firstThreeParticipantPosts = Array.from({ length: 3 }, (_, i) => {
        return PostEntityFake({
          authorId: challengeParticipants[i].id,
          parentChallengeId: challenge.id,
          createdAt: new Date(),
        });
      });
      posts.push(...firstThreeParticipantPosts.slice().reverse());
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getChallengeAllPostsFeedId(challenge.id),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeTodayEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 4,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const expectedFirstPagePosts = [
        firstAuthorPost,
        ...firstThreeParticipantPosts,
      ];
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.edges;
      expect(firstPageEdges.length).toBe(4);
      for (let i = 0; i < 4; i++) {
        const edge = firstPageEdges[i];
        expect(edge.node.id).toBe(expectedFirstPagePosts[i].id);
      }
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.pageInfo;
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: last(firstThreeParticipantPosts)?.id,
        startCursor: firstAuthorPost.id,
        count: 4,
        totalCount: 8,
      });
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeTodayEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 4,
              after: firstPageInfo.endCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.edges;
      const expectedSecondPagePosts = nextFourParticipantPosts.slice(0, 4);
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.pageInfo;
      for (let i = 0; i < 4; i++) {
        const edge = secondPageEdges[i];
        expect(edge.node.id).toBe(expectedSecondPagePosts[i].id);
      }
      expect(secondPageEdges.length).toBe(4);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: last(expectedSecondPagePosts)?.id,
        startCursor: first(expectedSecondPagePosts)?.id,
        count: 4,
        totalCount: 8,
      });
    });

    it(`should show author entries as hidden if participant hasn't posted today`, async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const participantWithoutEntryToday = UserEntityFake();
      const challengeParticipants = Array.from({ length: 4 }, () =>
        UserEntityFake()
      );
      const authorsPost = PostEntityFake({
        authorId: challengeAuthor.id,
        parentChallengeId: challenge.id,
        createdAt: new Date(),
      });
      await conn
        .getRepository(UserEntity)
        .insert([...challengeParticipants, participantWithoutEntryToday]);
      const posts = [
        PostEntityFake({
          authorId: participantWithoutEntryToday.id,
          parentChallengeId: challenge.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        }),
        authorsPost,
      ];
      for (const participant of challengeParticipants) {
        posts.push(
          PostEntityFake({
            authorId: participant.id,
            parentChallengeId: challenge.id,
            createdAt: new Date(),
          })
        );
      }
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getChallengeAllPostsFeedId(challenge.id),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeTodayEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 2,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.edges;
      expect(firstPageEdges.length).toBe(2);
      expect(firstPageEdges[0].node.id).toBe(authorsPost.id);
      expect(firstPageEdges[0].node.isHiddenOnChallenge).toBe(true);
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .send({
          query: getChallengeTodayEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 2,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .todayEntriesConnection.edges;
      expect(secondPageEdges.length).toBe(2);
      expect(secondPageEdges[0].node.id).toBe(authorsPost.id);
      expect(secondPageEdges[0].node.isHiddenOnChallenge).toBe(true);
    });
  });

  describe('userEntriesConnection', () => {
    it(`should paginate through user challenge entries`, async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const posts = [];
      for (let i = 0; i < 10; i++) {
        posts.push(
          PostEntityFake({
            authorId: challengeAuthor.id,
          })
        );
      }
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(
          challenge.id,
          challengeAuthor.id
        ),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const userEntriesQuery = /* GraphQL */ `
        query GetAllUserChallengeEntries(
          $getChallengeInput: GetChallengeInput!
          $challengeId: ID!
          $paginationInput: PaginationInput!
        ) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                userEntriesConnection(
                  challengeId: $challengeId
                  paginationInput: $paginationInput
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
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge.userEntriesConnection
          .edges;
      const expectedPostIds = posts
        .reverse()
        .slice(0, 6)
        .map(post => post.id);
      const actualPostIds = firstPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds).toEqual(expectedPostIds);
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge.userEntriesConnection
          .pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: last(expectedPostIds),
        startCursor: first(expectedPostIds),
        count: 6,
        totalCount: 10,
      });
      // Second page
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              after: firstPageInfo.endCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .userEntriesConnection.edges;
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge
          .userEntriesConnection.pageInfo;
      const expectedPostIds2 = posts.slice(6, 10).map(post => post.id);
      const actualPostIds2 = secondPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds2).toEqual(expectedPostIds2);
      expect(secondPageEdges.length).toBe(4);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: last(expectedPostIds2),
        startCursor: first(expectedPostIds2),
        count: 4,
        totalCount: 10,
      });
      const thirdPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              before: secondPageInfo.startCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(thirdPageResponse.status).toBe(200);
      const thirdPageEdges =
        thirdPageResponse.body.data.getChallenge.challenge.userEntriesConnection
          .edges;
      const actualPostIds3 = thirdPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds3).toEqual(expectedPostIds);
    });

    it(`should paginate through user challenge entries in reverse`, async () => {
      const challengeAuthor = UserEntityFake();
      await userRepo.insert(challengeAuthor);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const posts = [];
      for (let i = 0; i < 10; i++) {
        posts.push(
          PostEntityFake({
            authorId: challengeAuthor.id,
          })
        );
      }
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(
          challenge.id,
          challengeAuthor.id
        ),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const userEntriesQuery = /* GraphQL */ `
        query GetAllUserChallengeEntries(
          $getChallengeInput: GetChallengeInput!
          $challengeId: ID!
          $paginationInput: PaginationInput!
        ) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                userEntriesConnection(
                  challengeId: $challengeId
                  paginationInput: $paginationInput
                ) {
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                    count
                  }
                  edges {
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
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              order: PaginationOrder.OLDEST_FIRST,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge.userEntriesConnection
          .edges;
      const expectedPostIds = posts.slice(0, 6).map(post => post.id);
      const actualPostIds = firstPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds).toEqual(expectedPostIds);
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge.userEntriesConnection
          .pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: last(expectedPostIds),
        startCursor: first(expectedPostIds),
        count: 6,
      });
      // Second page
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              after: firstPageInfo.endCursor,
              order: PaginationOrder.OLDEST_FIRST,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .userEntriesConnection.edges;
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge
          .userEntriesConnection.pageInfo;
      // @ts-ignore
      expect(secondPageEdges.length).toBe(4);
      const expectedPostIds2 = posts.slice(6, 10).map(post => post.id);
      const actualPostIds2 = secondPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds2).toEqual(expectedPostIds2);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: last(expectedPostIds2),
        startCursor: posts[6].id,
        count: 4,
      });
      const thirdPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              before: secondPageInfo.startCursor,
              order: PaginationOrder.OLDEST_FIRST,
            },
            challengeId: challenge.id,
          },
        });
      expect(thirdPageResponse.status).toBe(200);
      const thirdPageEdges =
        thirdPageResponse.body.data.getChallenge.challenge.userEntriesConnection
          .edges;
      const actualPostIds3 = thirdPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds3).toEqual(expectedPostIds);
    });
  });

  describe('currentUserEntriesConnection', () => {
    it(`should paginate through a user challenge entries`, async () => {
      const challengeAuthor = UserEntityFake();
      const postAuthor = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, postAuthor]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const posts = [];
      for (let i = 0; i < 10; i++) {
        posts.push(
          PostEntityFake({
            authorId: postAuthor.id,
          })
        );
      }
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(challenge.id, postAuthor.id),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const userEntriesQuery = /* GraphQL */ `
        query GetAllUserChallengeEntries(
          $getChallengeInput: GetChallengeInput!
          $challengeId: ID!
          $paginationInput: PaginationInput!
        ) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                currentUserEntriesConnection(
                  challengeId: $challengeId
                  paginationInput: $paginationInput
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
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.edges;
      const expectedPostIds = posts
        .reverse()
        .slice(0, 6)
        .map(post => post.id);
      const actualPostIds = firstPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds).toEqual(expectedPostIds);
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: last(expectedPostIds),
        startCursor: first(expectedPostIds),
        count: 6,
        totalCount: 10,
      });
      // Second page
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              after: firstPageInfo.endCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.edges;
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.pageInfo;
      const expectedPostIds2 = posts.slice(6, 10).map(post => post.id);
      const actualPostIds2 = secondPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds2).toEqual(expectedPostIds2);
      expect(secondPageEdges.length).toBe(4);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: last(expectedPostIds2),
        startCursor: first(expectedPostIds2),
        count: 4,
        totalCount: 10,
      });
      const thirdPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              before: secondPageInfo.startCursor,
            },
            challengeId: challenge.id,
          },
        });
      expect(thirdPageResponse.status).toBe(200);
      const thirdPageEdges =
        thirdPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.edges;
      const actualPostIds3 = thirdPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds3).toEqual(expectedPostIds);
    });

    it(`should paginate through user challenge entries in reverse`, async () => {
      const challengeAuthor = UserEntityFake();
      const postAuthor = UserEntityFake();
      await conn
        .getRepository(UserEntity)
        .insert([challengeAuthor, postAuthor]);
      const challenge = ChallengeEntityFake({ authorId: challengeAuthor.id });
      await challengeRepo.insert(challenge);
      const posts = [];
      for (let i = 0; i < 10; i++) {
        posts.push(
          PostEntityFake({
            authorId: postAuthor.id,
          })
        );
      }
      await postRepo.insert(posts);
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(challenge.id, postAuthor.id),
        page: {
          ids: posts.map(post =>
            toChallengeParticipantPostEntryStr({
              postId: post.id,
              authorId: post.authorId,
              date: post.createdAt,
              hasPinned: false,
            })
          ),
          idsWithScore: {
            idsMap: {},
          },
        },
      });
      await feedRepo.insert(challengeAllEntriesFeed);
      const userEntriesQuery = /* GraphQL */ `
        query GetAllUserChallengeEntries(
          $getChallengeInput: GetChallengeInput!
          $challengeId: ID!
          $paginationInput: PaginationInput!
        ) {
          getChallenge(input: $getChallengeInput) {
            ... on GetChallengeResult {
              challenge {
                currentUserEntriesConnection(
                  challengeId: $challengeId
                  paginationInput: $paginationInput
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
      const firstPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              order: PaginationOrder.OLDEST_FIRST,
            },
            challengeId: challenge.id,
          },
        });
      expect(firstPageResponse.status).toBe(200);
      const firstPageEdges =
        firstPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.edges;
      const expectedPostIds = posts.slice(0, 6).map(post => post.id);
      const actualPostIds = firstPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds).toEqual(expectedPostIds);
      const firstPageInfo =
        firstPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.pageInfo;
      expect(firstPageEdges.length).toBe(6);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: last(expectedPostIds),
        startCursor: first(expectedPostIds),
        count: 6,
        totalCount: 10,
      });
      // Second page
      const secondPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              after: firstPageInfo.endCursor,
              order: PaginationOrder.OLDEST_FIRST,
            },
            challengeId: challenge.id,
          },
        });
      expect(secondPageResponse.status).toBe(200);
      const secondPageEdges =
        secondPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.edges;
      const secondPageInfo =
        secondPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.pageInfo;
      // @ts-ignore
      expect(secondPageEdges.length).toBe(4);
      const expectedPostIds2 = posts.slice(6, 10).map(post => post.id);
      const actualPostIds2 = secondPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds2).toEqual(expectedPostIds2);
      expect(secondPageInfo).toEqual({
        hasNextPage: false,
        hasPreviousPage: true,
        endCursor: last(expectedPostIds2),
        startCursor: first(expectedPostIds2),
        count: 4,
        totalCount: 10,
      });
      const thirdPageResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(postAuthor)}`)
        .send({
          query: userEntriesQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
            paginationInput: {
              take: 6,
              before: secondPageInfo.startCursor,
              order: PaginationOrder.OLDEST_FIRST,
            },
            challengeId: challenge.id,
          },
        });
      expect(thirdPageResponse.status).toBe(200);
      const thirdPageEdges =
        thirdPageResponse.body.data.getChallenge.challenge
          .currentUserEntriesConnection.edges;
      const actualPostIds3 = thirdPageEdges.map((edge: any) => edge.node.id);
      expect(actualPostIds3).toEqual(expectedPostIds);
    });
  });
});
