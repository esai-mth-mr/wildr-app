import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChallengeEntriesService } from '@verdzie/server/challenge/challenge-entries/challengeEntries.service';
import { EntitiesWithPagesCommon } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import {
  ChallengeEntryType,
  getChallengeAllPostsFeedId,
  getChallengePinnedEntriesFeedId,
  getUserPostEntriesOnChallengeFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { PostService } from '@verdzie/server/post/post.service';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';

describe('ChallengeEntriesService', () => {
  describe('getEntries', () => {
    it('should return all entries paginated', async () => {
      const currentUser = UserEntityFake({ id: 'currentUser' });
      const challenge = ChallengeEntityFake();
      const blockedFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id),
        ids: ['blockedUser'],
      });
      const blockedByFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, currentUser.id),
        ids: ['blockedByUser'],
      });
      const posts = [
        PostEntityFake({
          id: 'yesterdayPostId',
        }),
        PostEntityFake({
          id: 'notBlockedUserPostId',
        }),
        PostEntityFake({
          id: 'blockedUserPostId',
        }),
        PostEntityFake({
          id: 'blockedByUserPostId',
        }),
        PostEntityFake({
          id: 'pinnedPostId',
        }),
        PostEntityFake({
          id: 'currentUserIdPostId',
        }),
        PostEntityFake({
          id: 'challengeAuthorPostId',
        }),
      ];
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getChallengeAllPostsFeedId(challenge.id),
        ids: [
          JSON.stringify({
            postId: 'yesterdayPostId',
            authorId: 'notBlockedUser',
            date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'blockedUserPostId',
            authorId: 'blockedUser',
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'blockedByUserPostId',
            authorId: 'blockedByUser',
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'notBlockedUserPostId',
            authorId: 'notBlockedUser',
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'pinnedPostId',
            authorId: 'otherUserId',
            date: new Date(),
            hasPinned: true,
          }),
          JSON.stringify({
            postId: 'currentUserIdPostId',
            authorId: currentUser.id,
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'challengeAuthorPostId',
            authorId: challenge.authorId,
            date: new Date(),
            hasPinned: false,
          }),
        ],
      });
      const feeds = [blockedFeed, blockedByFeed, challengeAllEntriesFeed];
      const module = await Test.createTestingModule({
        imports: [WinstonBeanstalkModule.forRoot()],
        providers: [
          ChallengeEntriesService,
          EntitiesWithPagesCommon,
          FeedService,
          {
            provide: PostService,
            useValue: {
              findAllNonExpired: jest
                .fn()
                .mockImplementation((ids: string[]) => {
                  const foundPosts = [];
                  for (const postId of ids) {
                    const post = posts.find(post => post.id === postId);
                    if (post) {
                      foundPosts.push(post);
                    }
                  }
                  return foundPosts;
                }),
            },
          },
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: {
              metadata: { name: 'FeedEntity' },
              findByIds: jest.fn().mockImplementation((ids: string[]) => {
                const foundFeeds = [];
                for (const feedId of ids) {
                  const feed = feeds.find(feed => feed.id === feedId);
                  if (feed) {
                    foundFeeds.push(feed);
                  }
                }
                return foundFeeds;
              }),
              find: jest.fn().mockResolvedValueOnce([challengeAllEntriesFeed]),
            },
          },
        ],
      }).compile();
      const service = module.get(ChallengeEntriesService);
      const result = await service.getEntries({
        challenge,
        paginationInput: {
          take: 5,
        },
        currentUser: currentUser,
        entryType: ChallengeEntryType.ALL,
      });
      expect(service['postService'].findAllNonExpired).toHaveBeenCalledWith([
        'challengeAuthorPostId',
        'currentUserIdPostId',
        'pinnedPostId',
        'notBlockedUserPostId',
        'yesterdayPostId',
      ]);
      expect(result?.entries).toHaveLength(5);
      const pinnedPostId = result?.entries?.find(entry => entry.isPinned)?.post
        .id;
      expect(pinnedPostId).toBe('pinnedPostId');
      const blockedPostId = result?.entries?.find(
        entry => entry.post.id === 'blockedUserPostId'
      )?.post;
      expect(blockedPostId).toBeUndefined();
      const blockedByPostId = result?.entries?.find(
        entry => entry.post.id === 'blockedByUserPostId'
      )?.post;
      expect(blockedByPostId).toBeUndefined();
      expect(blockedByPostId).toBeUndefined();
      expect(result?.hasMoreItems).toBe(false);
      expect(result?.hasPreviousItems).toBe(false);
    });

    it('should find all featured entries', async () => {
      const currentUser = UserEntityFake({ id: 'currentUser' });
      const challenge = ChallengeEntityFake();
      const blockedFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id),
        ids: ['blockedUser'],
      });
      const blockedByFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, currentUser.id),
        ids: ['blockedByUser'],
      });
      const posts = [
        PostEntityFake({
          id: 'pinnedYesterdayPostId2',
        }),
        PostEntityFake({
          id: 'pinnedYesterdayPostId',
        }),
        PostEntityFake({
          id: 'notBlockedUserPostId',
        }),
        PostEntityFake({
          id: 'pinnedTodayPostId',
        }),
        PostEntityFake({
          id: 'currentUserIdPostId',
        }),
        PostEntityFake({
          id: 'challengeAuthorPostId',
        }),
      ];
      const challengePinnedEntriesFeed = FeedEntityFake({
        id: getChallengePinnedEntriesFeedId(challenge.id),
        ids: [
          JSON.stringify({
            postId: 'pinnedYesterdayPostId2',
            authorId: 'notBlockedUser',
            date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            hasPinned: true,
          }),
          JSON.stringify({
            postId: 'pinnedYesterdayPostId',
            authorId: 'notBlockedUser',
            date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            hasPinned: true,
          }),
          JSON.stringify({
            postId: 'blockedUserPostId',
            authorId: 'blockedUser',
            date: new Date(),
            hasPinned: true,
          }),
          JSON.stringify({
            postId: 'blockedByUserPostId',
            authorId: 'blockedByUser',
            date: new Date(),
            hasPinned: true,
          }),
          JSON.stringify({
            postId: 'pinnedTodayPostId',
            authorId: 'notBlockedUser',
            date: new Date(),
            hasPinned: true,
          }),
        ],
      });
      const feeds = [blockedFeed, blockedByFeed, challengePinnedEntriesFeed];
      const module = await Test.createTestingModule({
        imports: [WinstonBeanstalkModule.forRoot()],
        providers: [
          ChallengeEntriesService,
          EntitiesWithPagesCommon,
          FeedService,
          {
            provide: PostService,
            useValue: {
              findAllNonExpired: jest
                .fn()
                .mockImplementation((ids: string[]) => {
                  const foundPosts = [];
                  for (const postId of ids) {
                    const post = posts.find(post => post.id === postId);
                    if (post) {
                      foundPosts.push(post);
                    }
                  }
                  return foundPosts;
                }),
            },
          },
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: {
              metadata: { name: 'FeedEntity' },
              findByIds: jest.fn().mockImplementation((ids: string[]) => {
                const foundFeeds = [];
                for (const feedId of ids) {
                  const feed = feeds.find(feed => feed.id === feedId);
                  if (feed) {
                    foundFeeds.push(feed);
                  }
                }
                return foundFeeds;
              }),
              find: jest
                .fn()
                .mockResolvedValueOnce([challengePinnedEntriesFeed]),
            },
          },
        ],
      }).compile();
      const service = module.get(ChallengeEntriesService);
      const result = await service.getEntries({
        challenge,
        paginationInput: {
          take: 2,
        },
        currentUser: currentUser,
        entryType: ChallengeEntryType.FEATURED,
      });
      expect(service['postService'].findAllNonExpired).toHaveBeenCalledWith([
        'pinnedTodayPostId',
        'pinnedYesterdayPostId',
      ]);
      expect(result?.entries).toHaveLength(2);
      const blockedPostId = result?.entries?.find(
        entry => entry.post.id === 'blockedUserPostId'
      )?.post;
      expect(blockedPostId).toBeUndefined();
      const blockedByPostId = result?.entries?.find(
        entry => entry.post.id === 'blockedByUserPostId'
      )?.post;
      expect(blockedByPostId).toBeUndefined();
      expect(blockedByPostId).toBeUndefined();
      expect(result?.hasMoreItems).toBe(true);
      expect(result?.hasPreviousItems).toBe(false);
    });

    it('should paginate through users entries', async () => {
      const user = UserEntityFake({ id: 'user' });
      const challenge = ChallengeEntityFake();
      const posts = [
        PostEntityFake({
          id: 'twoDaysAgoPostId',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
        PostEntityFake({
          id: 'yesterdayPostId',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
        PostEntityFake({
          id: 'todayPostId2',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
        PostEntityFake({
          id: 'todayPostId',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
      ];
      const userPostEntriesOnChallengeFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(challenge.id, user.id),
        ids: [
          JSON.stringify({
            postId: 'twoDaysAgoPostId',
            authorId: user.id,
            date: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'yesterdayPostId',
            authorId: user.id,
            date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'todayPostId2',
            authorId: user.id,
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'todayPostId',
            authorId: user.id,
            date: new Date(),
            hasPinned: true,
          }),
        ],
      });
      const blockedFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, user.id),
        ids: ['blockedUser'],
      });
      const feeds = [blockedFeed, userPostEntriesOnChallengeFeed];
      const module = await Test.createTestingModule({
        imports: [WinstonBeanstalkModule.forRoot()],
        providers: [
          ChallengeEntriesService,
          EntitiesWithPagesCommon,
          FeedService,
          {
            provide: PostService,
            useValue: {
              findAllNonExpired: jest
                .fn()
                .mockImplementation((ids: string[]) => {
                  const foundPosts = [];
                  for (const postId of ids) {
                    const post = posts.find(post => post.id === postId);
                    if (post) {
                      foundPosts.push(post);
                    }
                  }
                  return foundPosts;
                }),
            },
          },
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: {
              metadata: { name: 'FeedEntity' },
              findOne: jest.fn().mockImplementation(async id => {
                const feed = feeds.find(feed => feed.id === id);
                if (feed) {
                  return feed;
                }
              }),
              find: jest
                .fn()
                .mockResolvedValueOnce([userPostEntriesOnChallengeFeed]),
            },
          },
        ],
      }).compile();
      const service = module.get(ChallengeEntriesService);
      const result = await service.getEntries({
        challenge,
        paginationInput: {
          take: 2,
          after: 'todayPostId',
        },
        currentUser: user,
        entryType: ChallengeEntryType.USER,
      });
      expect(result?.entries).toHaveLength(2);
      expect(result?.hasMoreItems).toBe(true);
      expect(result?.hasPreviousItems).toBe(true);
    });

    it("should not allow a blocked user to view a user's entries", async () => {
      const currentUser = UserEntityFake({ id: 'currentUser' });
      const user = UserEntityFake({ id: 'user' });
      const challenge = ChallengeEntityFake();
      const blockedFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, user.id),
        ids: ['currentUser'],
      });
      const posts = [
        PostEntityFake({
          id: 'twoDaysAgoPostId',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
        PostEntityFake({
          id: 'yesterdayPostId',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
        PostEntityFake({
          id: 'todayPostId2',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
        PostEntityFake({
          id: 'todayPostId',
          parentChallengeId: challenge.id,
          authorId: user.id,
        }),
      ];
      const userPostEntriesOnChallengeFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(challenge.id, user.id),
        ids: [
          JSON.stringify({
            postId: 'twoDaysAgoPostId',
            authorId: user.id,
            date: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'yesterdayPostId',
            authorId: user.id,
            date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'todayPostId2',
            authorId: user.id,
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'todayPostId',
            authorId: user.id,
            date: new Date(),
            hasPinned: true,
          }),
        ],
      });
      const feeds = [blockedFeed];
      const module = await Test.createTestingModule({
        imports: [WinstonBeanstalkModule.forRoot()],
        providers: [
          ChallengeEntriesService,
          EntitiesWithPagesCommon,
          FeedService,
          {
            provide: PostService,
            useValue: {
              findAllNonExpired: jest
                .fn()
                .mockImplementation((ids: string[]) => {
                  const foundPosts = [];
                  for (const postId of ids) {
                    const post = posts.find(post => post.id === postId);
                    if (post) {
                      foundPosts.push(post);
                    }
                  }
                  return foundPosts;
                }),
            },
          },
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: {
              metadata: { name: 'FeedEntity' },
              findOne: jest.fn().mockImplementation(async id => {
                const feed = feeds.find(feed => feed.id === id);
                if (feed) {
                  return feed;
                }
              }),
              find: jest
                .fn()
                .mockResolvedValueOnce([userPostEntriesOnChallengeFeed]),
            },
          },
        ],
      }).compile();
      const service = module.get(ChallengeEntriesService);
      const result = await service.getEntries({
        challenge,
        paginationInput: {
          take: 2,
          after: 'todayPostId',
        },
        currentUser,
        userToSearchForId: user.id,
        entryType: ChallengeEntryType.USER,
      });
      expect(result?.entries).toHaveLength(0);
    });

    it('should paginate through todays entries', async () => {
      const currentUser = UserEntityFake({ id: 'currentUser' });
      const challenge = ChallengeEntityFake();
      const blockedFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id),
        ids: ['blockedUser'],
      });
      const blockedByFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, currentUser.id),
        ids: ['blockedByUser'],
      });
      const posts = [
        PostEntityFake({
          id: 'yesterdayPostId',
        }),
        PostEntityFake({
          id: 'notBlockedUserPostId',
        }),
        PostEntityFake({
          id: 'blockedUserPostId',
        }),
        PostEntityFake({
          id: 'blockedByUserPostId',
        }),
        PostEntityFake({
          id: 'pinnedPostId',
        }),
        PostEntityFake({
          id: 'currentUserIdPostId',
        }),
        PostEntityFake({
          id: 'challengeAuthorPostId',
        }),
      ];
      const challengeAllEntriesFeed = FeedEntityFake({
        id: getChallengeAllPostsFeedId(challenge.id),
        ids: [
          JSON.stringify({
            postId: 'currentUsersPostFromYesterdayId',
            authorId: 'notBlockedUser',
            date: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'blockedUserPostId',
            authorId: 'blockedUser',
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'blockedByUserPostId',
            authorId: 'blockedByUser',
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'notBlockedUserPostId',
            authorId: 'notBlockedUser',
            date: new Date(),
            hasPinned: false,
          }),
          JSON.stringify({
            postId: 'challengeAuthorPostId',
            authorId: challenge.authorId,
            date: new Date(),
            hasPinned: false,
          }),
        ],
      });
      const feeds = [blockedFeed, blockedByFeed, challengeAllEntriesFeed];
      const module = await Test.createTestingModule({
        imports: [WinstonBeanstalkModule.forRoot()],
        providers: [
          ChallengeEntriesService,
          EntitiesWithPagesCommon,
          FeedService,
          {
            provide: PostService,
            useValue: {
              findAllNonExpired: jest
                .fn()
                .mockImplementation((ids: string[]) => {
                  const foundPosts = [];
                  for (const postId of ids) {
                    const post = posts.find(post => post.id === postId);
                    if (post) {
                      foundPosts.push(post);
                    }
                  }
                  return foundPosts;
                }),
            },
          },
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: {
              metadata: { name: 'FeedEntity' },
              findByIds: jest.fn().mockImplementation((ids: string[]) => {
                const foundFeeds = [];
                for (const feedId of ids) {
                  const feed = feeds.find(feed => feed.id === feedId);
                  if (feed) {
                    foundFeeds.push(feed);
                  }
                }
                return foundFeeds;
              }),
              find: jest.fn().mockResolvedValueOnce([challengeAllEntriesFeed]),
            },
          },
        ],
      }).compile();
      const service = module.get(ChallengeEntriesService);
      const result = await service.getEntries({
        challenge,
        paginationInput: {
          take: 5,
        },
        currentUser: currentUser,
        entryType: ChallengeEntryType.TODAY,
      });
      expect(service['postService'].findAllNonExpired).toHaveBeenCalledWith([
        'challengeAuthorPostId',
        'notBlockedUserPostId',
      ]);
      expect(result?.entries).toHaveLength(2);
      const blockedPostId = result?.entries?.find(
        entry => entry.post.id === 'blockedUserPostId'
      )?.post;
      expect(blockedPostId).toBeUndefined();
      const blockedByPostId = result?.entries?.find(
        entry => entry.post.id === 'blockedByUserPostId'
      )?.post;
      expect(blockedByPostId).toBeUndefined();
      expect(result?.hasMoreItems).toBe(false);
      expect(result?.hasPreviousItems).toBe(false);
      expect(result?.entries[0].isHidden).toBe(true);
    });
  });
});
