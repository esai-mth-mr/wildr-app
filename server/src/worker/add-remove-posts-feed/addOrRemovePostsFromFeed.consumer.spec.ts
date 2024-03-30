import { TestingModule } from '@nestjs/testing';
import {
  AddOrRemovePostsFromFeedConsumer,
  RemovePostsInput,
} from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeed.consumer';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  FeedEntity,
  FollowingUserPostsFeedBasedOnPostTypes,
  FollowingUserPostsFeedTypes,
  ICYMFollowingPostsFeedEnums,
  ICYMPostsFeedEnums,
  ListPostsConsumption,
  ListPostsForConsumptionBasedOnPostTypes,
  PersonalizedFeedEnums,
  PersonalizedFollowingFeedEnums,
  RelevantFollowingPostsFeedEnums,
  RelevantPostsFeedEnums,
  RemainingFollowingPostsFeedEnums,
  RemainingPostsFeedEnums,
} from '@verdzie/server/feed/feed.entity';
import {
  AddOrRemovePostsToFeedJob,
  RemovePostIdsFromPostFeedsJob,
} from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeed.producer';
import { Job } from 'bull';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostType } from '@verdzie/server/post/data/post-type';
import { PostVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { ignoreInnerCirclePostsPredicate } from '@verdzie/server/post/post-repository/post.predicates';
import { MoreThan, Raw } from 'typeorm';
import {
  getPostFeedId,
  innerCircleListIdForFetchingPostsFeed,
} from '@verdzie/server/user-list/userList.helpers';
import { faker } from '@faker-js/faker';
import _ from 'lodash';

const BATCH_SIZE = 10;

const fakeJob = JobFake({
  data: {
    whoseFeed: 'follower_id',
    whosePosts: 'leader_id',
  },
}) as Job<AddOrRemovePostsToFeedJob>;

describe('AddOrRemovePostsFromFeedConsumer', () => {
  let service: AddOrRemovePostsFromFeedConsumer;
  let module: TestingModule;

  beforeEach(async () => {
    module = await createMockedTestingModule({
      providers: [AddOrRemovePostsFromFeedConsumer],
    });
    service = module.get(AddOrRemovePostsFromFeedConsumer);
    // @ts-ignore
    service['batchSize'] = BATCH_SIZE;
  });

  describe('addTheirPosts', () => {
    /**
     * Generates fake follower feeds and posts with correct relations in each feed
     * entity's page's ids. The number of each post type is random. A map from
     * post id to post is also returned to make checking the updates easier.
     */
    const generateFollowerFeeds = ({
      postCount,
      reverseChronological = false,
    }: {
      postCount: number;
      reverseChronological?: boolean;
    }) => {
      const postIdToPost: { [key: string]: PostEntity } = {};
      const feedsBasedOnPostType: FeedEntity[] = Array.from(
        { length: 6 },
        (_, i) => {
          const feed = new FeedEntity();
          feed.id = `${i}`;
          return feed;
        }
      );

      // Generate random posts with random types
      const followerPosts = Array.from({ length: postCount }, () => {
        const post = PostEntityFake({});
        post.id = `follower_${post.id}_${post.type}`;
        return post;
      })
        .sort((a, b) => {
          if (reverseChronological) {
            return +b.createdAt - +a.createdAt;
          }
          return +a.createdAt - +b.createdAt;
        })
        .map(post => {
          feedsBasedOnPostType[0].page.ids.push(post.id);
          feedsBasedOnPostType[post.type].page.ids.push(post.id);
          postIdToPost[post.id] = post;

          return post;
        });

      return {
        followerPosts,
        postIdToPost,
        feedsBasedOnPostType,
      };
    };

    /**
     * Generates a leader's feed with posts and correct relations from the feed
     * entity's page's ids to the posts. A map of post ids can be past as a
     * parameter and it will be updated with the generated posts. The posts will
     * be ordered in _reverse_ chronological order.
     */
    const generateLeaderFeed = ({
      postCount,
      postIdToPost,
    }: {
      postCount: number;
      postIdToPost: { [key: string]: PostEntity };
    }) => {
      const leaderFeed = new FeedEntity();
      const leaderPosts = Array.from({ length: postCount }, () => {
        const post = PostEntityFake({});
        post.id = `leader_${post.id}_${post.type}`;
        return post;
      })
        .sort((a, b) => {
          return +b.createdAt - +a.createdAt;
        })
        .map(post => {
          postIdToPost[post.id] = post;
          leaderFeed.page.ids.push(post.id);

          return post;
        });

      return {
        leaderFeed,
        leaderPosts,
      };
    };

    /**
     * Retrieves the number of occurrences of post types in an array of post
     * entities.
     */
    const countPostTypes = (
      posts: PostEntity[],
      postTypeCounts: Map<PostType, number> = new Map()
    ) => {
      posts.forEach(p => {
        if (postTypeCounts.has(p.type)) {
          //@ts-ignore
          postTypeCounts.set(p.type, postTypeCounts.get(p.type) + 1);
        } else {
          postTypeCounts.set(p.type, 1);
        }
      });

      return postTypeCounts;
    };

    it('should fail fast if the number of feeds effected is illogical', async () => {
      const feedsBasedOnPostType = Array.from(
        { length: FollowingUserPostsFeedBasedOnPostTypes.length + 1 },
        () => new FeedEntity()
      );

      const result = await service['addTheirPosts'](
        fakeJob,
        feedsBasedOnPostType
      );

      expect(result).toBe(undefined);
    });

    it('should return early if the leader does not have a feed', async () => {
      const feedsBasedOnPostType = Array.from(
        { length: FollowingUserPostsFeedBasedOnPostTypes.length },
        () => new FeedEntity()
      );

      service['feedService'].find = jest.fn().mockResolvedValue(undefined);
      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(true);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType);

      expect(service['feedService'].find).toBeCalledTimes(1);
      expect(service['userService'].isPartOfInnerCircle).toBeCalledTimes(0);

      service['feedService'].find = jest.fn().mockResolvedValue({
        page: {
          ids: [],
        },
      });
      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(true);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType);

      expect(service['feedService'].find).toBeCalledTimes(1);
      expect(service['userService'].isPartOfInnerCircle).toBeCalledTimes(0);
    });

    it('should retrieve correct follower posts', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 20,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 20,
        postIdToPost,
      });

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].update = jest.fn();

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(false);

      const followerBatch = followerPosts.slice(
        followerPosts.length - BATCH_SIZE
      );
      const followerBatchIds = followerBatch.map(f => f.id);
      const oldestFollowerDate =
        _.first(followerBatch)?.createdAt || new Date(0);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchOldFilteredOut = leaderBatch.filter(p => {
        return p.createdAt > oldestFollowerDate;
      });

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatchOldFilteredOut);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType);

      // @ts-expect-error
      const followerPostSearch = service['postService'].findByIds.mock.calls[0];
      expect(followerPostSearch[0]).toEqual(followerBatchIds);
    });

    it('should retrieve leader public posts batch', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 20,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 20,
        postIdToPost,
      });

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].update = jest.fn();

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(false);

      const followerBatch = followerPosts.slice(
        followerPosts.length - BATCH_SIZE
      );
      const oldestFollowerDate =
        _.first(followerBatch)?.createdAt || new Date(0);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchIds = leaderBatch.map(l => l.id);
      const leaderBatchOldFilteredOut = leaderBatch.filter(p => {
        return p.createdAt > oldestFollowerDate;
      });

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatchOldFilteredOut);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType);

      // @ts-expect-error
      const leaderPostSearch = service['postService'].findByIds.mock.calls[1];
      expect(leaderPostSearch[0]).toEqual(leaderBatchIds);
      expect(leaderPostSearch[1].where).toMatchObject({
        ...{ createdAt: MoreThan(oldestFollowerDate.toISOString()) },
        ...ignoreInnerCirclePostsPredicate,
      });
    });

    it('should update follower all posts feed in order', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 20,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 20,
        postIdToPost,
      });

      const fakeTransactionManager = {
        update: jest.fn(),
      };

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/ban-types
          transaction: async (fn: Function) => {
            await fn(fakeTransactionManager);
          },
        },
      };

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(false);

      const followerBatch = followerPosts.slice(
        followerPosts.length - BATCH_SIZE
      );
      const oldestFollowerDate =
        _.first(followerBatch)?.createdAt || new Date(0);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchOldFilteredOut = leaderBatch.filter(p => {
        return p.createdAt > oldestFollowerDate;
      });

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatchOldFilteredOut);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType);

      const updatedIds =
        fakeTransactionManager.update.mock.calls[4][2].page.ids;
      expect(updatedIds).toHaveLength(
        followerPosts.length + leaderBatchOldFilteredOut.length
      );

      updatedIds.forEach((id: string, i: number) => {
        if (i < 1) return;
        const currPost = postIdToPost[id];
        const prevPost = postIdToPost[updatedIds[i - 1]];

        expect(+currPost.createdAt).toBeGreaterThanOrEqual(+prevPost.createdAt);
      });
    });

    it('should add posts to follower feed type specific feeds in order', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 40,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 10,
        postIdToPost,
      });

      const fakeTransactionManager = {
        update: jest.fn(),
      };

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/ban-types
          transaction: async (fn: Function) => {
            await fn(fakeTransactionManager);
          },
        },
      };

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(false);

      const followerBatch = followerPosts.slice(
        followerPosts.length - BATCH_SIZE
      );
      const oldestFollowerDate =
        _.first(followerBatch)?.createdAt || new Date(0);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchOldFilteredOut = leaderBatch.filter(p => {
        return p.createdAt > oldestFollowerDate;
      });

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatchOldFilteredOut);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType);

      const postCounts = countPostTypes(
        leaderBatchOldFilteredOut.concat(followerPosts)
      );

      for (let call = 0; call < 4; call++) {
        const feedType = Number(
          fakeTransactionManager.update.mock.calls[call][1].id
        );

        const updatedIds =
          fakeTransactionManager.update.mock.calls[call][2].page.ids;

        expect(updatedIds.length).toBe(postCounts.get(feedType) || 0);

        updatedIds.forEach((id: string, i: number) => {
          const post = postIdToPost[id];
          expect(post.type).toBe(feedType);

          if (i > 0) {
            expect(+post.createdAt).toBeGreaterThanOrEqual(
              +postIdToPost[updatedIds[i - 1]].createdAt
            );
          }
        });
      }
    });

    it('should search for follower posts in chronological order when reverseChronological is true', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 15,
          reverseChronological: true,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 15,
        postIdToPost,
      });

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].update = jest.fn();

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(true);

      const followerBatch = followerPosts
        .reverse()
        .slice(followerPosts.length - BATCH_SIZE);

      const followerBatchIds = followerBatch.map(f => f.id);
      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatch);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType, true);

      // @ts-expect-error
      const followerPostSearch = service['postService'].findByIds.mock.calls[0];
      expect(followerPostSearch[0]).toEqual(followerBatchIds);
    });

    it('should include inner circle posts from leaders feed when follower in inner circle', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 15,
          reverseChronological: true,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 15,
        postIdToPost,
      });

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].update = jest.fn();

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(true);

      const followerBatch = followerPosts
        .reverse()
        .slice(followerPosts.length - BATCH_SIZE);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchIds = leaderBatch.map(l => l.id);

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatch);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType, true);

      // @ts-expect-error
      const leaderPostSearch = service['postService'].findByIds.mock.calls[1];
      expect(leaderPostSearch[0]).toEqual(leaderBatchIds);
      expect(leaderPostSearch[1].where).toMatchObject({});
    });

    it('should include old posts if leader has not posted recently', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 20,
          reverseChronological: false,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 20,
        postIdToPost,
      });

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].update = jest.fn();
      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(true);

      const followerBatch = followerPosts
        .reverse()
        .slice(followerPosts.length - BATCH_SIZE);
      const oldestFollowerDate =
        _.first(followerBatch)?.createdAt || new Date(0);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchIds = leaderBatch.map(l => l.id);

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(leaderBatch);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType, true);

      const firstLeaderPostSearch =
        // @ts-expect-error
        service['postService'].findByIds.mock.calls[1];
      expect(firstLeaderPostSearch[0]).toEqual(leaderBatchIds);
      expect(firstLeaderPostSearch[1].where).toMatchObject({
        ...{ createdAt: MoreThan(oldestFollowerDate.toISOString()) },
      });
    });

    it('should add posts to followers all post feed in reverse chron order when reverseChron is true', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 20,
          reverseChronological: true,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 20,
        postIdToPost,
      });

      const fakeTransactionManager = {
        update: jest.fn(),
      };

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/ban-types
          transaction: async (fn: Function) => {
            await fn(fakeTransactionManager);
          },
        },
      };

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(true);

      const followerBatch = followerPosts
        .reverse()
        .slice(followerPosts.length - BATCH_SIZE);
      const oldestFollowerDate =
        _.first(followerBatch)?.createdAt || new Date(0);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchOldFilteredOut = leaderBatch.filter(p => {
        return +p.createdAt > +oldestFollowerDate;
      });

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatchOldFilteredOut);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType, true);

      const updatedIds =
        fakeTransactionManager.update.mock.calls[4][2].page.ids;
      expect(updatedIds).toHaveLength(
        followerPosts.length + leaderBatchOldFilteredOut.length
      );

      updatedIds.forEach((id: string, i: number) => {
        if (i < 1) return;

        expect(+postIdToPost[id].createdAt).toBeLessThanOrEqual(
          +postIdToPost[updatedIds[i - 1]].createdAt
        );
      });
    });

    it('should add posts to feed type specific feeds in reverse chron order when reverseChron is true', async () => {
      const { postIdToPost, followerPosts, feedsBasedOnPostType } =
        generateFollowerFeeds({
          postCount: 50,
          reverseChronological: true,
        });

      const { leaderFeed, leaderPosts } = generateLeaderFeed({
        postCount: 50,
        postIdToPost,
      });

      const fakeTransactionManager = {
        update: jest.fn(),
      };

      service['feedService'].find = jest.fn().mockResolvedValue(leaderFeed);
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/ban-types
          transaction: async (fn: Function) => {
            await fn(fakeTransactionManager);
          },
        },
      };

      service['userService'].isPartOfInnerCircle = jest
        .fn()
        .mockResolvedValue(true);

      const followerBatch = followerPosts
        .reverse()
        .slice(followerPosts.length - BATCH_SIZE);
      const oldestFollowerDate =
        _.first(followerBatch)?.createdAt || new Date(0);

      const leaderBatch = leaderPosts.slice(0, BATCH_SIZE);
      const leaderBatchOldFilteredOut = leaderBatch.filter(p => {
        return +p.createdAt > +oldestFollowerDate;
      });

      service['postService'].findByIds = jest
        .fn()
        .mockResolvedValueOnce(followerBatch)
        .mockResolvedValueOnce(leaderBatchOldFilteredOut);

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType, true);

      for (let call = 0; call < 4; call++) {
        const feedType = Number(
          fakeTransactionManager.update.mock.calls[call][1].id
        );
        const updatedIds =
          fakeTransactionManager.update.mock.calls[call][2].page.ids;

        updatedIds.forEach((id: string, i: number) => {
          const post = postIdToPost[id];
          expect(post.type).toBe(feedType);

          if (i < 1) return;

          expect(+post.createdAt).toBeLessThanOrEqual(
            +postIdToPost[updatedIds[i - 1]].createdAt
          );
        });
      }
    });

    it('should catch errors to allow processor to continue', async () => {
      const { feedsBasedOnPostType } = generateFollowerFeeds({
        postCount: 15,
        reverseChronological: true,
      });

      service['feedService'].find = jest.fn().mockRejectedValue('error');

      await service['addTheirPosts'](fakeJob, feedsBasedOnPostType);
    });
  });

  describe('addTheirPostsToFollowingFeed', () => {
    it('should create feeds that a user is missing', async () => {
      service['feedService'].findOrCreate = jest
        .fn()
        .mockResolvedValue(new FeedEntity());
      service['addTheirPosts'] = jest.fn();

      await service.addTheirPostsToFollowingFeed(fakeJob);

      expect(service['feedService'].findOrCreate).toHaveBeenCalledTimes(
        FollowingUserPostsFeedBasedOnPostTypes.length - 1
      );
    });

    it('should call addTheirPosts', async () => {
      service['feedService'].findOrCreate = jest
        .fn()
        .mockResolvedValue(new FeedEntity());
      service['addTheirPosts'] = jest.fn();

      await service.addTheirPostsToFollowingFeed(fakeJob);

      expect(service['addTheirPosts']).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      const args = service['addTheirPosts'].mock.calls[0];
      expect(args[0]).toBe(fakeJob);
      expect(args[1]).toHaveLength(
        FollowingUserPostsFeedBasedOnPostTypes.length
      );
      expect(args[2]).toBe(true);
    });
  });

  describe('addTheirPostsToInnerCircleFeed', () => {
    it('should create feeds that a user is missing with inner circle ids', async () => {
      service['feedService'].findOrCreateWithId = jest
        .fn()
        .mockResolvedValue(new FeedEntity());
      service['addTheirPosts'] = jest.fn();

      await service.addTheirPostsToInnerCircleFeed(fakeJob);

      expect(service['feedService'].findOrCreateWithId).toHaveBeenCalledTimes(
        ListPostsForConsumptionBasedOnPostTypes.length - 1
      );

      const expectedId = getPostFeedId(
        innerCircleListIdForFetchingPostsFeed(fakeJob.data.whoseFeed),
        ListPostsForConsumptionBasedOnPostTypes[0]
      );

      // @ts-expect-error
      const id = service['feedService'].findOrCreateWithId.mock.calls[0][0];
      expect(id).toBe(expectedId);
    });

    it('should call addTheirPosts with job and correct feeds', async () => {
      service['feedService'].findOrCreateWithId = jest
        .fn()
        .mockResolvedValue(new FeedEntity());
      service['addTheirPosts'] = jest.fn();

      await service.addTheirPostsToInnerCircleFeed(fakeJob);

      expect(service['addTheirPosts']).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      const args = service['addTheirPosts'].mock.calls[0];
      expect(args[0]).toBe(fakeJob);
      expect(args[1]).toHaveLength(
        ListPostsForConsumptionBasedOnPostTypes.length
      );
    });
  });

  const currentUserId = 'currentUserid';
  const otherUserId = 'other_user_id';

  const removeTheirPostsJob = {
    whoseFeed: currentUserId,
    whosePosts: otherUserId,
  };

  const fakeCurrentUser = new UserEntity();
  fakeCurrentUser.id = currentUserId;

  const fakeOtherUser = new UserEntity();
  fakeOtherUser.id = otherUserId;

  const generateUserFeed = ({ postCount }: { postCount: number }) => {
    const userFeed = new FeedEntity();
    const userPosts = Array.from({ length: postCount }, () => {
      const post = PostEntityFake({});
      post.id = `${post.id}_${post.type}`;
      return post;
    })
      .sort((a, b) => {
        return +b.createdAt - +a.createdAt;
      })
      .map(post => {
        userFeed.page.ids.push(post.id);
        userFeed.page.idsWithScore.idsMap[post.id] = 1;

        return post;
      });

    return {
      userFeed,
      userPosts,
    };
  };

  describe('removeTheirPosts', () => {
    it('should fail fast if missing currentUser', async () => {
      service['userService'].findById = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(new UserEntity());
      service['postService'].findWithConditions = jest.fn();

      await service['removePosts']({
        data: removeTheirPostsJob,
        feedsIdsToRemoveFrom: [],
        feedsWithIdsMapToRemoveFrom: [],
      });
      expect(service['postService'].findWithConditions).toBeCalledTimes(0);
      expect(service['userService'].findById).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      const firstCallUserId = service['userService'].findById.mock.calls[0][0];
      expect(firstCallUserId).toBe(currentUserId);
    });

    it('should remove posts from page ids', async () => {
      service['userService'].findById = jest
        .fn()
        .mockResolvedValueOnce(fakeCurrentUser)
        .mockResolvedValueOnce(fakeOtherUser);

      const postCount = 50;
      const rmCount = 10;
      const { userFeed, userPosts } = generateUserFeed({ postCount });
      const postsToRm = faker.helpers.arrayElements(userPosts, rmCount);
      const postsToRmIds = postsToRm.map(p => p.id);

      service['postService'].findWithConditions = jest
        .fn()
        .mockResolvedValueOnce(postsToRm);

      service['feedService'].find = jest.fn().mockResolvedValue(userFeed);
      service['feedService'].save = jest.fn();

      await service['removePosts']({
        data: removeTheirPostsJob,
        feedsIdsToRemoveFrom: ['a', 'b'],
        feedsWithIdsMapToRemoveFrom: [],
      });

      expect(service['postService'].findWithConditions).toHaveBeenCalledWith({
        authorId: removeTheirPostsJob.whosePosts,
      });

      expect(service['feedService'].save).toHaveBeenCalledTimes(2);

      // @ts-expect-error
      const firstSavedFeed = service['feedService'].save.mock.calls[0][0][0];
      // @ts-expect-error
      const secondSavedFeed = service['feedService'].save.mock.calls[1][0][0];

      expect(firstSavedFeed.page.ids.length).toBe(postCount - rmCount);
      expect(secondSavedFeed.page.ids.length).toBe(postCount - rmCount);

      const notRemoved = firstSavedFeed.page.ids.filter((id: string) =>
        postsToRmIds.includes(id)
      );

      expect(notRemoved.length).toBe(0);
    });

    it('should remove posts from page score maps', async () => {
      service['userService'].findById = jest
        .fn()
        .mockResolvedValueOnce(fakeCurrentUser)
        .mockResolvedValueOnce(fakeOtherUser);

      const postCount = 50;
      const rmCount = 10;
      const { userFeed, userPosts } = generateUserFeed({ postCount });
      const postsToRm = faker.helpers.arrayElements(userPosts, rmCount);
      const postsToRmIds = postsToRm.map(p => p.id);

      service['postService'].findWithConditions = jest
        .fn()
        .mockResolvedValueOnce(postsToRm);

      service['feedService'].find = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(userFeed);
      service['feedService'].save = jest.fn();

      await service['removePosts']({
        data: removeTheirPostsJob,
        feedsIdsToRemoveFrom: ['a'],
        feedsWithIdsMapToRemoveFrom: ['b'],
      });

      expect(service['feedService'].find).toHaveBeenCalledTimes(2);
      expect(service['feedService'].save).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      const firstSavedFeed = service['feedService'].save.mock.calls[0][0][0];
      const firstFeedMap = firstSavedFeed.page.idsWithScore.idsMap;

      const notRemoved = postsToRmIds.filter((id: string) =>
        _.has(firstFeedMap, id)
      );

      expect(notRemoved.length).toBe(0);
    });
  });

  describe('removeInnerCirclePostsFromTheirFeeds', () => {
    it('should retrieve only inner circle posts to remove', async () => {
      // @ts-expect-error
      service['postService'].repo = {
        find: jest.fn().mockResolvedValueOnce([]),
      };

      await service.removeInnerCirclePostsFromTheirFeeds(fakeJob);

      expect(service['postService'].repo.find).toHaveBeenCalledTimes(1);
      // @ts-expect-error
      const searchParams = service['postService'].repo.find.mock.calls[0][0];

      const expectedSearch = {
        accessControl: Raw(
          access_control =>
            `${access_control} -> 'postVisibilityAccessData' = '{"access": ${PostVisibilityAccess.INNER_CIRCLE} }'`
        ),
        authorId: fakeJob.data.whosePosts,
      };

      expect(searchParams.toString()).toBe(expectedSearch.toString());
    });

    it('should remove posts from follower user and personalized feeds', async () => {
      const rmCount = 10;
      const postCount = 30;
      const { userFeed, userPosts } = generateUserFeed({ postCount });
      const postsToRm = faker.helpers.arrayElements(userPosts, rmCount);
      const postsToRmIds = postsToRm.map(p => p.id);

      // @ts-ignore
      service['postService'].repo = {
        find: jest.fn().mockResolvedValueOnce(postsToRm),
      };

      const entityManager = {
        update: jest.fn(),
      };
      service['feedService'].repo = {
        // @ts-expect-error
        manager: {
          transaction: (fn: any) => {
            return fn(entityManager);
          },
        },
      };

      service['feedService'].find = jest.fn().mockResolvedValue(userFeed);

      await service.removeInnerCirclePostsFromTheirFeeds(fakeJob);

      const totalFeedCount =
        FollowingUserPostsFeedTypes.length +
        PersonalizedFeedEnums.length +
        ListPostsConsumption.length;

      expect(service['feedService'].find).toHaveBeenCalledTimes(totalFeedCount);

      for (let i = 0; i < totalFeedCount; i++) {
        const updateArgs = entityManager.update.mock.calls[0];

        expect(updateArgs[1].id).toBe(userFeed.id);
        expect(updateArgs[2].page.ids.length).toBe(postCount - rmCount);

        const notRemoved = updateArgs[2].page.ids.filter((id: string) =>
          postsToRmIds.includes(id)
        );

        expect(notRemoved).toHaveLength(0);
      }
    });

    it('should accept that feeds will not always be found', async () => {
      const rmCount = 10;
      const postCount = 30;
      const { userPosts } = generateUserFeed({ postCount });
      const postsToRm = faker.helpers.arrayElements(userPosts, rmCount);

      // @ts-ignore
      service['postService'].repo = {
        find: jest.fn().mockResolvedValueOnce(postsToRm),
      };

      const entityManager = {
        update: jest.fn(),
      };
      service['feedService'].repo = {
        // @ts-expect-error
        manager: {
          transaction: (fn: any) => {
            return fn(entityManager);
          },
        },
      };

      service['feedService'].find = jest.fn().mockResolvedValue(undefined);

      await service.removeInnerCirclePostsFromTheirFeeds(fakeJob);

      const totalFeedCount =
        FollowingUserPostsFeedTypes.length +
        PersonalizedFeedEnums.length +
        ListPostsConsumption.length;

      expect(service['feedService'].find).toHaveBeenCalledTimes(totalFeedCount);

      expect(entityManager.update).toBeCalledTimes(0);
    });
  });

  describe('removeTheirPostsFromInnerCircleFeed', () => {
    it('should call removePosts with job data and consumption feed ids', async () => {
      service['removePosts'] = jest.fn();

      await service.removeTheirPostsFromInnerCircleFeed(fakeJob);

      expect(service['removePosts']).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      const removePostsArgs = service['removePosts'].mock.calls[0];
      const input: RemovePostsInput = removePostsArgs[0];
      expect(input.data).toBe(fakeJob.data);
      expect(input.feedsIdsToRemoveFrom).toHaveLength(
        ListPostsConsumption.length
      );
    });
  });

  describe('removeTheirPostsFromFollowingFeed', () => {
    it('should call removePosts with job data and all user feeds', async () => {
      service['removePosts'] = jest.fn();

      await service.removeTheirPostsFromFollowingFeed(fakeJob);

      expect(service['removePosts']).toHaveBeenCalledTimes(1);

      // @ts-expect-error
      const removePostsInput = service['removePosts'].mock.calls[0][0];
      expect(removePostsInput.data).toBe(fakeJob.data);
    });
  });

  describe('removePostIdsFromPostFeeds', () => {
    it('should call removePostsIdsFromPostFeeds with job data and remove post all user feeds', async () => {
      service['removePosts'] = jest.fn();

      const fakeJob = JobFake({
        data: {
          postIds: 'a',
          ownerId: 'leader_id',
        },
      }) as Job<RemovePostIdsFromPostFeedsJob>;
      await service.removePostsIdsFromPostFeeds(fakeJob);

      expect(service['removePosts']).toHaveBeenCalledTimes(1);

      // @ts-ignore
      const removePostsArgs = service['removePosts'].mock.calls[0][0];
      expect(removePostsArgs.data).toStrictEqual({
        whoseFeed: 'leader_id',
        whosePosts: '',
      });
      expect(removePostsArgs.feedsIdsToRemoveFrom).toHaveLength(
        [
          ...PersonalizedFollowingFeedEnums,
          ...PersonalizedFeedEnums,
          ...FollowingUserPostsFeedTypes,
        ].length
      );
      expect(removePostsArgs.feedsWithIdsMapToRemoveFrom).toHaveLength(
        [
          ...RelevantFollowingPostsFeedEnums,
          ...RelevantPostsFeedEnums,
          ...ICYMPostsFeedEnums,
          ...ICYMFollowingPostsFeedEnums,
          ...RemainingPostsFeedEnums,
          ...RemainingFollowingPostsFeedEnums,
        ].length
      );
    });
  });
});
