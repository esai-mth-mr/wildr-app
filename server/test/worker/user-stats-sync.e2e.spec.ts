import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Test, TestingModule } from '@nestjs/testing';
import {
  WildrBullModule,
  defaultRedis,
} from '@verdzie/server/bull/wildr-bull.module';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { OpenTelemetryMetricsModule } from '@verdzie/server/opentelemetry/openTelemetry.module';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserListEntityFake } from '@verdzie/server/user-list/testing/userList.entity.fake';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { UserStatsSyncConsumer } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.consumer';
import { UserStatsSyncConsumerModule } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.consumer.module';
import { UserStatsSyncProducer } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer';
import { UserStatsSyncJobData } from '@verdzie/server/worker/user-stats-sync/user-stats-sync-worker.config';
import { USER_STATS_SYNC_QUEUE_NAME } from '@verdzie/server/worker/user-stats-sync/user-stats-sync-worker.config';
import { UserStatsSyncProducerModule } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer.module';
import {
  WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
  WorkflowManagerTaskCompletionJobData,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.producer';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { findJob, getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import Redis from 'ioredis';
import { Connection, Repository } from 'typeorm';

describe('User Stats Sync Worker', () => {
  let statsSyncConsumer: UserStatsSyncConsumer;
  let statsSyncProducer: UserStatsSyncProducer;
  let conn: Connection;
  let redis: Redis;
  let module: TestingModule;
  let userRepo: Repository<UserEntity>;
  let userListRepo: Repository<UserListEntity>;
  let feedRepo: Repository<FeedEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        OpenTelemetryMetricsModule,
        WinstonBeanstalkModule.forRoot(),
        WildrTypeormModule,
        WildrBullModule,
        RedisModule.forRoot({
          config: defaultRedis,
        }),
        UserStatsSyncConsumerModule,
        UserStatsSyncProducerModule,
      ],
    }).compile();
    conn = await getTestConnection();
    await conn.synchronize(true);
    redis = await getRedisConnection();
    userRepo = conn.getRepository(UserEntity);
    userListRepo = conn.getRepository(UserListEntity);
    feedRepo = conn.getRepository(FeedEntity);
    statsSyncConsumer = module.get(UserStatsSyncConsumer);
    statsSyncProducer = module.get(UserStatsSyncProducer);
  });

  const cleanDb = async () => {
    await feedRepo.delete({});
    await userListRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
    await redis.flushall();
  });

  afterAll(async () => {
    await cleanDb();
    await conn.close();
    await redis.quit();
  });

  describe('User Stats Sync Producer', () => {
    it('should produce user stats sync jobs', async () => {
      const jobData: UserStatsSyncJobData = {
        userId: 'userId',
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowInstanceId',
          taskId: 'taskId',
          shardId: 0,
        },
      };
      await statsSyncProducer.createUserStatsSyncJob(jobData);
      const job = await findJob({
        queue: USER_STATS_SYNC_QUEUE_NAME,
      });
      expect(job).toBeDefined();
      expect(job?.data).toEqual(jobData);
    });
  });

  describe('User Stats Sync Consumer', () => {
    it('should sync user stats', async () => {
      const user = UserEntityFake();
      user.setStats({
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        innerCircleCount: 0,
      });
      const userInnerCircle = UserListEntityFake({
        id: innerCircleListId(user.id),
        ids: [user.id],
      });
      const userFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, user.id),
        ids: ['userId2', 'userId3'],
      });
      const userFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, user.id),
        ids: ['userId4', 'userId5'],
      });
      const userPostFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, user.id),
        ids: ['userId6', 'userId7'],
      });
      await feedRepo.insert([
        userFollowingFeed,
        userFollowerFeed,
        userPostFeed,
      ]);
      await userListRepo.insert(userInnerCircle);
      await userRepo.insert(user);
      const jobData: UserStatsSyncJobData = {
        userId: user.id,
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowInstanceId',
          taskId: 'taskId',
          shardId: 0,
        },
      };
      const job = JobFake({ data: jobData });
      await statsSyncConsumer.processUserStatsSyncJob(job);
      const updatedUser = await userRepo.findOneOrFail(user.id);
      expect(updatedUser.getStats()).toEqual({
        followerCount: 2,
        followingCount: 2,
        postCount: 2,
        innerCircleCount: 1,
      });
    });

    it('should create workflow completion jobs', async () => {
      const user = UserEntityFake();
      await userRepo.insert(user);
      const jobData: UserStatsSyncJobData = {
        userId: user.id,
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowInstanceId',
          taskId: 'taskId',
          shardId: 0,
        },
      };
      const job = JobFake({ data: jobData });
      await statsSyncConsumer.processUserStatsSyncJob(job);
      const workflowCompletionJob = await findJob({
        queue: WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
      });
      expect(workflowCompletionJob).toBeDefined();
      const expectedData: WorkflowManagerTaskCompletionJobData = {
        workflowId: WorkflowId.USER_STATS_SYNC,
        workflowInstanceId: 'workflowInstanceId',
        shardId: 0,
        taskId: 'taskId',
        bullJobId: job.id,
      };
      expect(workflowCompletionJob?.data).toEqual(expectedData);
    });
  });
});
