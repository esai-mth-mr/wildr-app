import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TestingModule } from '@nestjs/testing';
import {
  WildrBullModule,
  defaultRedis,
} from '@verdzie/server/bull/wildr-bull.module';
import {
  FeedEntity,
  FeedEntityType,
  FollowingUserPostsFeedBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import { PostVisibility } from '@verdzie/server/generated-graphql';
import { OpenTelemetryMetricsModule } from '@verdzie/server/opentelemetry/openTelemetry.module';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { DistributePostsToFollowingPostsFeedConsumerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.consumer.module';
import { DistributePostsToFollowingPostsFeedProducerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.producer.module';
import { DistributePostsToFollowingPostsFeedConsumer } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeed.consumer';
import {
  DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME,
  DistributePostToFollowingPostsJob,
  DistributePostsToFollowingPostsFeedProducer,
} from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeed.producer';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { findJob, getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import Redis from 'ioredis';
import { Connection, Repository } from 'typeorm';

describe('DistributePostsToFollowingPostsFeedService', () => {
  let consumer: DistributePostsToFollowingPostsFeedConsumer;
  let producer: DistributePostsToFollowingPostsFeedProducer;
  let db: Connection;
  let redis: Redis;
  let module: TestingModule;
  let feedRepo: Repository<FeedEntity>;
  let userRepo: Repository<UserEntity>;
  let postRepo: Repository<PostEntity>;

  beforeAll(async () => {
    module = await createMockedTestingModule({
      imports: [
        OpenTelemetryMetricsModule,
        WinstonBeanstalkModule.forRoot(),
        WildrTypeormModule,
        WildrBullModule,
        RedisModule.forRoot({
          config: defaultRedis,
        }),
        DistributePostsToFollowingPostsFeedConsumerModule,
        DistributePostsToFollowingPostsFeedProducerModule,
      ],
    });
    consumer = module.get(DistributePostsToFollowingPostsFeedConsumer);
    producer = module.get(DistributePostsToFollowingPostsFeedProducer);
    db = await getTestConnection();
    redis = await getRedisConnection();
    await db.synchronize(true);
    feedRepo = db.getRepository(FeedEntity);
    userRepo = db.getRepository(UserEntity);
    postRepo = db.getRepository(PostEntity);
  });

  const cleanDb = async () => {
    await feedRepo.delete({});
    await postRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(async () => {
    await redis.flushall();
    await cleanDb();
  });

  afterAll(async () => {
    await redis.flushall();
    await cleanDb();
    await db.close();
    await module.close();
  });

  describe('Producer', () => {
    it('should enqueue a job', async () => {
      const jobData: DistributePostToFollowingPostsJob = {
        postId: '1',
        userIds: ['2'],
        userIdsToSkip: [],
        postVisibility: PostVisibility.ALL,
        shouldNotifyFollowers: true,
      };
      await producer.distributePostsToFollowingPostsFeed(jobData);
      const job = await findJob({
        queue: DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME,
      });
      expect(job).toBeDefined();
      expect(job?.data).toEqual(jobData);
    });
  });

  describe('Consumer', () => {
    it('should add post to new following posts feeds', async () => {
      const author = UserEntityFake();
      const follower1 = UserEntityFake();
      const follower2 = UserEntityFake();
      await userRepo.insert([author, follower1, follower2]);
      const post = PostEntityFake({ authorId: author.id });
      await postRepo.insert(post);
      const authorFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, author.id),
        page: FeedPageFake({
          ids: [follower1.id, follower2.id],
        }),
      });
      await feedRepo.insert(authorFollowerFeed);
      const jobData: DistributePostToFollowingPostsJob = {
        postId: post.id,
        userIds: [follower1.id, follower2.id],
        userIdsToSkip: [],
        postVisibility: PostVisibility.ALL,
        shouldNotifyFollowers: false,
      };
      await consumer.distributePostToFollowingPostsFeed(
        JobFake({ data: jobData })
      );
      const feeds = await feedRepo.findByIds([
        toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
        toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower2.id),
      ]);
      expect(feeds).toHaveLength(2);
      expect(feeds[0].page.ids).toEqual([post.id]);
      expect(feeds[0].count).toEqual(1);
      expect(feeds[1].page.ids).toEqual([post.id]);
      expect(feeds[1].count).toEqual(1);
    });

    it('should add post to existing followers feeds', async () => {
      const author = UserEntityFake();
      const follower1 = UserEntityFake();
      await userRepo.insert([author, follower1]);
      const post = PostEntityFake({ authorId: author.id });
      await postRepo.insert(post);
      const authorFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, author.id),
        page: FeedPageFake({
          ids: [follower1.id],
        }),
      });
      const follower1FollowingPostsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
        page: FeedPageFake({
          ids: ['postId'],
        }),
      });
      await feedRepo.insert([authorFollowerFeed, follower1FollowingPostsFeed]);
      const jobData: DistributePostToFollowingPostsJob = {
        postId: post.id,
        userIds: [follower1.id],
        userIdsToSkip: [],
        postVisibility: PostVisibility.ALL,
        shouldNotifyFollowers: false,
      };
      await consumer.distributePostToFollowingPostsFeed(
        JobFake({ data: jobData })
      );
      const feeds = await feedRepo.findByIds([
        toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, follower1.id),
      ]);
      expect(feeds).toHaveLength(1);
      expect(feeds[0].page.ids).toEqual([post.id, 'postId']);
      expect(feeds[0].count).toEqual(2);
    });

    it('should add post to post type specific feeds', async () => {
      const author = UserEntityFake();
      const follower1 = UserEntityFake();
      await userRepo.insert([author, follower1]);
      const post = PostEntityFake({ authorId: author.id });
      await postRepo.insert(post);
      const authorFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, author.id),
        page: FeedPageFake({
          ids: [follower1.id],
        }),
      });
      const follower1FollowingPostsFeed = FeedEntityFake({
        id: toFeedId(
          FollowingUserPostsFeedBasedOnPostTypes[post.type],
          follower1.id
        ),
        page: FeedPageFake({
          ids: ['postId'],
        }),
      });
      await feedRepo.insert([authorFollowerFeed, follower1FollowingPostsFeed]);
      const jobData: DistributePostToFollowingPostsJob = {
        postId: post.id,
        userIds: [follower1.id],
        userIdsToSkip: [],
        postVisibility: PostVisibility.ALL,
        shouldNotifyFollowers: false,
      };
      await consumer.distributePostToFollowingPostsFeed(
        JobFake({ data: jobData })
      );
      const feeds = await feedRepo.findByIds([
        toFeedId(
          FollowingUserPostsFeedBasedOnPostTypes[post.type],
          follower1.id
        ),
      ]);
      expect(feeds).toHaveLength(1);
      expect(feeds[0].page.ids).toEqual([post.id, 'postId']);
      expect(feeds[0].count).toEqual(2);
    });
  });
});
