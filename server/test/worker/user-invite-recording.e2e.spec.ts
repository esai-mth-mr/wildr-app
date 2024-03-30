import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Test, TestingModule } from '@nestjs/testing';
import {
  WildrBullModule,
  defaultRedis,
} from '@verdzie/server/bull/wildr-bull.module';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import { OpenTelemetryMetricsModule } from '@verdzie/server/opentelemetry/openTelemetry.module';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { InviteListRecordingConsumer } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.consumer';
import { InviteListRecordingConsumerModule } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.consumer.module';
import {
  INVITE_LIST_RECORDING_QUEUE_NAME,
  InviteListRecordingJobData,
  InviteListRecordingProducer,
} from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer';
import { InviteListRecordingProducerModule } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer.module';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { findJob, getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import Redis from 'ioredis';
import { Connection, Repository } from 'typeorm';

describe('User Invite Recording Worker', () => {
  let inviteRecordingConsumer: InviteListRecordingConsumer;
  let inviteRecordingProducer: InviteListRecordingProducer;
  let db: Connection;
  let redis: Redis;
  let module: TestingModule;
  let feedRepo: Repository<FeedEntity>;

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
        InviteListRecordingConsumerModule,
        InviteListRecordingProducerModule,
      ],
    });
    inviteRecordingConsumer = module.get(InviteListRecordingConsumer);
    inviteRecordingProducer = module.get(InviteListRecordingProducer);
    db = await getTestConnection();
    redis = await getRedisConnection();
    await db.synchronize(true);
    feedRepo = db.getRepository(FeedEntity);
  });

  const cleanDb = async () => {
    await feedRepo.delete({});
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
      await inviteRecordingProducer.createInviteListRecordingJob({
        referrerId: '1',
        inviteeId: '2',
      });
      const job = await findJob({
        queue: INVITE_LIST_RECORDING_QUEUE_NAME,
      });
      expect(job).toBeDefined();
      expect(job?.data).toEqual({
        referrerId: '1',
        inviteeId: '2',
      });
    });
  });

  describe('Consumer', () => {
    it('should add an invite to a new referrers feed', async () => {
      const referrer = UserEntityFake();
      const invitee = UserEntityFake();
      const jobData: InviteListRecordingJobData = {
        referrerId: referrer.id,
        inviteeId: invitee.id,
      };
      const job = JobFake({ data: jobData });
      await inviteRecordingConsumer.processInviteListRecordingJob(job);
      const referredFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.REFERRED_USERS, referrer.id)
      );
      expect(referredFeed).toBeDefined();
      expect(referredFeed?.page.ids).toEqual([invitee.id]);
    });

    it('should add an invite to an existing referrers feed', async () => {
      const referrer = UserEntityFake();
      const invitee = UserEntityFake();
      const someoneElse = UserEntityFake();
      const referredFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, referrer.id),
        page: FeedPageFake({
          ids: [someoneElse.id],
        }),
      });
      await feedRepo.insert(referredFeed);
      const jobData: InviteListRecordingJobData = {
        referrerId: referrer.id,
        inviteeId: invitee.id,
      };
      const job = JobFake({ data: jobData });
      await inviteRecordingConsumer.processInviteListRecordingJob(job);
      const updatedReferredFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.REFERRED_USERS, referrer.id)
      );
      expect(updatedReferredFeed).toBeDefined();
      expect(updatedReferredFeed?.page.ids).toEqual([
        invitee.id,
        someoneElse.id,
      ]);
    });
  });
});
