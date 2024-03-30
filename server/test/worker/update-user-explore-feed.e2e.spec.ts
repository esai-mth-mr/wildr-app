import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UpdateUserExploreFeedConsumer } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.consumer';
import { UpdateUserExploreFeedProducer } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer';
import { Connection } from 'typeorm';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  FeedEntity,
  FeedEntityType,
  isFeedType,
} from '@verdzie/server/feed/feed.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { UpdateUserExploreFeedConsumerModule } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.consumer.module';
import { UpdateUserExploreFeedProducerModule } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer.module';

describe('UpdateUserExploreFeed', () => {
  let consumer: UpdateUserExploreFeedConsumer;
  let producer: UpdateUserExploreFeedProducer;
  let conn: Connection;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        TypeOrmModule.forFeature([UserSchema]),
        FeedModule,
        UpdateUserExploreFeedConsumerModule,
        UpdateUserExploreFeedProducerModule,
      ],
    });
    consumer = module.get(UpdateUserExploreFeedConsumer);
    producer = module.get(UpdateUserExploreFeedProducer);
    conn = await getTestConnection();
    await conn.synchronize(true);
  });

  beforeEach(async () => {
    await conn.getRepository(UserEntity).delete({});
    await conn.getRepository(FeedEntity).delete({});
  });

  afterAll(async () => {
    await conn.getRepository(UserEntity).delete({});
    await conn.getRepository(FeedEntity).delete({});
    await conn.close();
  });

  describe('Producer', () => {
    describe('updateUserExploreFeed', () => {
      it('should add a job to the queue', async () => {
        await producer.updateUserExploreFeed({
          userId: '1',
          shouldNotifyUserAboutFeedCreated: true,
        });
      });
    });
  });

  describe('Consumer', () => {
    it(`should return if the user cannot be found`, async () => {
      const result = await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: '1' } })
      );
      expect(result).toEqual(undefined);
    });

    it(`should add relevant posts to a user's explore feed`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '',
        feedCursors: { startOfConsumed: '' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['4', '3'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '6': 6 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsFeed?.page.ids).toEqual(['6', '5', '4', '3']);
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedAllPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual({
        '5': 5,
        '6': 6,
      });
    });

    it(`should not update the feed if the user has not consumed any posts`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '',
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['5', '4', '3', '1'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '4': 4, '3': 3 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsFeed?.page.ids).toEqual(['5', '4', '3', '1']);
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedAllPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual({
        '5': 5,
        '4': 4,
        '3': 3,
      });
    });

    it(`should move consumed posts after unconsumed posts`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '5',
        feedCursors: { startOfConsumed: '3' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['5', '4', '3'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '4': 4 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsFeed?.page.ids).toEqual(['4', '5', '3']);
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedAllPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual({
        '4': 4,
      });
      const userEntity = await conn.getRepository(UserEntity).findOne(user.id);
      expect(userEntity?.lastSeenCursorPersonalizedFeed).toEqual('');
      expect(userEntity?.feedCursors?.startOfConsumed).toEqual('5');
    });

    it(`should remove consumed posts from relevant feed`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '3',
        feedCursors: { startOfConsumed: '3' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['4', '3', '2'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '6': 6, '4': 4 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsFeed?.page.ids).toEqual(['6', '5', '4', '3', '2']);
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedAllPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual({
        '5': 5,
        '6': 6,
      });
    });

    it(`should move un-consumed posts ahead of consumed posts`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '3',
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['4', '3', '2', '1'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: {
              idsMap: { '5': 5, '4': 4, '3': 3, '2': 2 },
            },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsFeed?.page.ids).toEqual(['5', '2', '4', '3', '1']);
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedAllPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual({
        '5': 5,
        '2': 2,
      });
    });

    it(`should add relevant posts to an empty feed`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '',
      });
      user.feedCursors = undefined;
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: {
              idsMap: { '4': 4, '5': 5 },
            },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsFeed?.page.ids).toEqual(['5', '4']);
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsRelevantFeed?.page.ids).toEqual([]);
      // The feed should be empty because the first posts on a users feed are
      // automatically considered consumed so that `startOfConsumed` has a
      // location to point to. If we don't have a start of consumed we can't
      // determine if a post is consumed or not.
      expect(updatedAllPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual({});
    });

    it(`should add relevant posts to a user's text post explore feed`, async () => {
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_TEXT_POSTS, user.id),
          page: {
            ids: ['1'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_TEXT_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedTextPostsFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.PERSONALIZED_TEXT_POSTS.toString())
      );
      expect(updatedTextPostsFeed?.page.ids).toEqual(['5', '1']);
      const updatedTextPostsRelevantFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.RELEVANT_TEXT_POSTS.toString())
      );
      expect(updatedTextPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedTextPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual(
        {}
      );
    });

    it(`should add relevant posts to a user's image post explore feed`, async () => {
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_IMAGE_POSTS, user.id),
          page: {
            ids: ['2'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_IMAGE_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '6': 6 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedImagePostsFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.PERSONALIZED_IMAGE_POSTS.toString())
      );
      expect(updatedImagePostsFeed?.page.ids).toEqual(['6', '2']);
      const updatedImagePostsRelevantFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.RELEVANT_IMAGE_POSTS.toString())
      );
      expect(updatedImagePostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedImagePostsRelevantFeed?.page.idsWithScore.idsMap).toEqual(
        {}
      );
    });

    it(`should add relevant posts to a user's video post explore feed`, async () => {
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_VIDEO_POSTS, user.id),
          page: {
            ids: ['3'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_VIDEO_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '7': 7 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedVideoPostsFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.PERSONALIZED_VIDEO_POSTS.toString())
      );
      expect(updatedVideoPostsFeed?.page.ids).toEqual(['7', '3']);
      const updatedVideoPostsRelevantFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.RELEVANT_VIDEO_POSTS.toString())
      );
      expect(updatedVideoPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedVideoPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual(
        {}
      );
    });

    it(`should add relevant posts to a user's collage explore feed`, async () => {
      const user = UserEntityFake();
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_COLLAGE_POSTS, user.id),
          page: {
            ids: ['4'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_COLLAGE_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '8': 8 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedCollagePostsFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.PERSONALIZED_COLLAGE_POSTS.toString())
      );
      expect(updatedCollagePostsFeed?.page.ids).toEqual(['8', '4']);
      const updatedCollagePostsRelevantFeed = updatedFeeds.find(f =>
        f.id.startsWith(FeedEntityType.RELEVANT_COLLAGE_POSTS.toString())
      );
      expect(updatedCollagePostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedCollagePostsRelevantFeed?.page.idsWithScore.idsMap).toEqual(
        {}
      );
    });

    it(`should create user explore feeds if they don't exist`, async () => {
      const user = UserEntityFake();
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5 } },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_TEXT_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5 } },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_VIDEO_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '7': 7 } },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_COLLAGE_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '8': 8 } },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_IMAGE_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '6': 6 } },
          },
        }),
      ];
      await conn.getRepository(UserEntity).insert(user);
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const foundFeeds = await conn.getRepository(FeedEntity).find();
      expect(foundFeeds).toHaveLength(10);
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedCollagePostsFeed = updatedFeeds.find(f =>
        isFeedType({ feed: f, type: FeedEntityType.PERSONALIZED_COLLAGE_POSTS })
      );
      expect(updatedCollagePostsFeed?.page.ids).toEqual(['8']);
      const updatedCollagePostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ feed: f, type: FeedEntityType.RELEVANT_COLLAGE_POSTS })
      );
      expect(updatedCollagePostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedCollagePostsRelevantFeed?.page.idsWithScore.idsMap).toEqual(
        {}
      );
      const updatedVideoPostsFeed = updatedFeeds.find(f =>
        isFeedType({ feed: f, type: FeedEntityType.PERSONALIZED_VIDEO_POSTS })
      );
      expect(updatedVideoPostsFeed?.page.ids).toEqual(['7']);
      const updatedVideoPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ feed: f, type: FeedEntityType.RELEVANT_VIDEO_POSTS })
      );
      expect(updatedVideoPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedVideoPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual(
        {}
      );
      const updatedImagePostsFeed = updatedFeeds.find(f =>
        isFeedType({ feed: f, type: FeedEntityType.PERSONALIZED_IMAGE_POSTS })
      );
      expect(updatedImagePostsFeed?.page.ids).toEqual(['6']);
      const updatedImagePostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ feed: f, type: FeedEntityType.RELEVANT_IMAGE_POSTS })
      );
      expect(updatedImagePostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedImagePostsRelevantFeed?.page.idsWithScore.idsMap).toEqual(
        {}
      );
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsFeed?.page.ids).toEqual(['5']);
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      expect(updatedAllPostsRelevantFeed?.page.ids).toEqual([]);
      expect(updatedAllPostsRelevantFeed?.page.idsWithScore.idsMap).toEqual({});
    });

    it(`should update the user's explore feed cursor if hasNewRelevantPosts`, async () => {
      const lastUpdatedAt = new Date();
      const user = UserEntityFake({
        exploreFeedUpdatedAt: lastUpdatedAt,
        lastSeenCursorPersonalizedFeed: '1',
        hasConsumedExploreFeed: true,
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['2', '1'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '2': 2, '5': 5 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedUser = await conn.getRepository(UserEntity).findOne(user.id);
      expect(updatedUser?.exploreFeedUpdatedAt).not.toEqual(lastUpdatedAt);
      expect(updatedUser?.lastSeenCursorPersonalizedFeed).toEqual('');
      expect(updatedUser?.hasConsumedExploreFeed).toEqual(false);
    });

    it(`should update the user's explore feed cursor if hasUnconsumedPosts posts`, async () => {
      const lastUpdatedAt = new Date();
      const user = UserEntityFake({
        exploreFeedUpdatedAt: lastUpdatedAt,
        lastSeenCursorPersonalizedFeed: '2',
        hasConsumedExploreFeed: true,
        feedCursors: { startOfConsumed: '0' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['2', '1', '0'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: {} },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedUser = await conn.getRepository(UserEntity).findOne(user.id);
      expect(updatedUser?.exploreFeedUpdatedAt).not.toEqual(lastUpdatedAt);
      expect(updatedUser?.lastSeenCursorPersonalizedFeed).toEqual('');
      expect(updatedUser?.hasConsumedExploreFeed).toEqual(false);
    });

    it(`should not update the user's explore feed cursor if nothing new can be shown`, async () => {
      const lastUpdatedAt = new Date();
      const user = UserEntityFake({
        exploreFeedUpdatedAt: lastUpdatedAt,
        lastSeenCursorPersonalizedFeed: '1',
        hasConsumedExploreFeed: true,
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['2', '1', '0'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '2': 2 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedUser = await conn.getRepository(UserEntity).findOne(user.id);
      expect(updatedUser?.exploreFeedUpdatedAt).toEqual(lastUpdatedAt);
      expect(updatedUser?.lastSeenCursorPersonalizedFeed).toEqual('1');
      expect(updatedUser?.hasConsumedExploreFeed).toEqual(true);
    });

    it(`should create a job to update the view count of consumed posts`, async () => {
      const lastUpdatedAt = new Date();
      const user = UserEntityFake({
        exploreFeedUpdatedAt: lastUpdatedAt,
        lastSeenCursorPersonalizedFeed: '1',
        hasConsumedExploreFeed: true,
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['2', '1', '0'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '2': 2 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      consumer['updateViewCountProducer'].updateViewCount = jest.fn();
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      expect(
        consumer['updateViewCountProducer'].updateViewCount
      ).toHaveBeenCalledWith({
        userId: user.id,
        postIds: ['2', '1'],
      });
    });

    it(`should not create a job to update the view count if no posts are consumed`, async () => {
      const lastUpdatedAt = new Date();
      const user = UserEntityFake({
        exploreFeedUpdatedAt: lastUpdatedAt,
        lastSeenCursorPersonalizedFeed: '',
        hasConsumedExploreFeed: true,
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['2', '1', '0'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '2': 2 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      consumer['updateViewCountProducer'].updateViewCount = jest.fn();
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      expect(
        consumer['updateViewCountProducer'].updateViewCount
      ).not.toHaveBeenCalled();
    });

    it(`should add the consumed posts to the user's consumed posts feed`, async () => {
      const lastUpdatedAt = new Date();
      const user = UserEntityFake({
        exploreFeedUpdatedAt: lastUpdatedAt,
        lastSeenCursorPersonalizedFeed: '1',
        hasConsumedExploreFeed: true,
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['3', '2', '1', '0'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '3': 3, '2': 2 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const userConsumedPostsFeed = await conn
        .getRepository(FeedEntity)
        .findOne(toFeedId(FeedEntityType.CONSUMED_ALL_POSTS, user.id));
      expect(userConsumedPostsFeed?.page.ids).toEqual(['3', '2', '1']);
    });

    it(`should not allow for duplicates in the consumed posts feed`, async () => {
      const lastUpdatedAt = new Date();
      const user = UserEntityFake({
        exploreFeedUpdatedAt: lastUpdatedAt,
        lastSeenCursorPersonalizedFeed: '1',
        hasConsumedExploreFeed: true,
        feedCursors: { startOfConsumed: '1' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['3', '2', '1', '0'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: {
              idsMap: {
                '3': 3,
                '2': 2,
                '1': 1,
              },
            },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.CONSUMED_ALL_POSTS, user.id),
          page: {
            ids: ['3'],
            idsWithScore: { idsMap: {} },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const userConsumedPostsFeed = await conn
        .getRepository(FeedEntity)
        .findOne(toFeedId(FeedEntityType.CONSUMED_ALL_POSTS, user.id));
      expect(userConsumedPostsFeed?.page.ids).toEqual(['3', '2', '1']);
    });

    it(`should self heal start of consumed when it is unknown`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '5',
        feedCursors: { startOfConsumed: '' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['5', '4', '3', '2'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '4': 4, '3': 3 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      const updatedUser = await conn.getRepository(UserEntity).findOne(user.id);
      expect(
        updatedAllPostsFeed?.page.ids.indexOf(
          updatedUser!.feedCursors!.startOfConsumed
        )
      ).toEqual(
        Object.keys(updatedAllPostsRelevantFeed!.page.idsWithScore.idsMap)
          .length
      );
    });

    it(`should self heal start of consumed when it is unknown (with new post)`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '4',
        feedCursors: { startOfConsumed: '' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['5', '4', '3', '2'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '4': 4, '3': 3, '6': 6 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      const updatedUser = await conn.getRepository(UserEntity).findOne(user.id);
      expect(
        updatedAllPostsFeed?.page.ids.indexOf(
          updatedUser!.feedCursors!.startOfConsumed
        )
      ).toEqual(
        Object.keys(updatedAllPostsRelevantFeed!.page.idsWithScore.idsMap)
          .length
      );
    });

    it(`should setup start of consumed for new users`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '',
        feedCursors: { startOfConsumed: '' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '4': 4 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      await conn
        .getRepository(UserEntity)
        .update(user.id, { feedCursors: { startOfConsumed: '5' } });
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedFeeds = await conn.getRepository(FeedEntity).find();
      const updatedAllPostsFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.PERSONALIZED_ALL_POSTS, feed: f })
      );
      const updatedAllPostsRelevantFeed = updatedFeeds.find(f =>
        isFeedType({ type: FeedEntityType.RELEVANT_ALL_POSTS, feed: f })
      );
      const updatedUser = await conn.getRepository(UserEntity).findOne(user.id);
      expect(
        updatedAllPostsFeed?.page.ids.indexOf(
          updatedUser!.feedCursors!.startOfConsumed
        )
      ).toEqual(
        Object.keys(updatedAllPostsRelevantFeed!.page.idsWithScore.idsMap)
          .length
      );
    });

    it(`should not allow duplicate posts in explore feed`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '',
        feedCursors: { startOfConsumed: '' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['5', '4', '5'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '4': 4 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const personalizedAllPostsFeed = await conn
        .getRepository(FeedEntity)
        .findOne(toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id));
      expect(personalizedAllPostsFeed?.page.ids).toEqual(['5', '4']);
    });

    it(`feed order should recover after start of consumed is fixed`, async () => {
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '4',
        feedCursors: { startOfConsumed: '0' },
      });
      await conn.getRepository(UserEntity).insert(user);
      const feeds = [
        FeedEntityFake({
          id: toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id),
          page: {
            ids: ['5', '4', '3', '2', '5'],
            idsWithScore: { idsMap: {} },
          },
        }),
        FeedEntityFake({
          id: toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id),
          page: {
            ids: [],
            idsWithScore: { idsMap: { '5': 5, '4': 4, '3': 3, '2': 2 } },
          },
        }),
      ];
      await conn.getRepository(FeedEntity).insert(feeds);
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      const updatedUser = await conn.getRepository(UserEntity).findOne(user.id);
      expect(updatedUser?.feedCursors?.startOfConsumed).toEqual('5');
      let relevantFeed = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id));
      await conn
        .getRepository(FeedEntity)
        .update(toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id), {
          page: {
            ids: [],
            idsWithScore: {
              idsMap: {
                ...relevantFeed.page.idsWithScore.idsMap,
                '6': 6,
              },
            },
          },
        });
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      let updatedPersonalizedFeed = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(
          toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id)
        );
      expect(updatedPersonalizedFeed.page.ids).toEqual([
        '6',
        '3',
        '2',
        '5',
        '4',
      ]);
      relevantFeed = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id));
      await conn
        .getRepository(FeedEntity)
        .update(toFeedId(FeedEntityType.RELEVANT_ALL_POSTS, user.id), {
          page: {
            ids: [],
            idsWithScore: {
              idsMap: {
                ...relevantFeed.page.idsWithScore.idsMap,
                '7': 7,
              },
            },
          },
        });
      await consumer.updateUserExploreFeedsInTxn(
        JobFake({ data: { userId: user.id } })
      );
      updatedPersonalizedFeed = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(
          toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, user.id)
        );
      expect(updatedPersonalizedFeed.page.ids).toEqual([
        '7', // New items are in order
        '6',
        '3',
        '2',
        '5', // Old items marked as consumed (even though they are not in order)
        '4', // to ensure that the feed has a start of consumed to reference
      ]);
    });
  });
});
