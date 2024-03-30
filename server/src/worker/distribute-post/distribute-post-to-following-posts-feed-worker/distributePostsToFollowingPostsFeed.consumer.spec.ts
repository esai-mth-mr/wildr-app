import { PostNotFoundException } from '@verdzie/server/post/post.exceptions';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { PostgresTransactionFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { DistributePostsToFollowingPostsFeedConsumer } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeed.consumer';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { err, ok } from 'neverthrow';

describe(DistributePostsToFollowingPostsFeedConsumer.name, () => {
  let consumer: DistributePostsToFollowingPostsFeedConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [DistributePostsToFollowingPostsFeedConsumer],
    });
    consumer = module.get(DistributePostsToFollowingPostsFeedConsumer);
  });

  describe(
    DistributePostsToFollowingPostsFeedConsumer.prototype
      .distributePostToFollowingPostsFeed,
    () => {
      it('should distribute post to following posts feed', async () => {
        consumer[
          'distPostsToFollowingService'
        ].distributePostToFollowingPostsFeed = jest
          .fn()
          .mockResolvedValue(ok(true));
        const job = JobFake({
          data: { postId: 'post-id', userIds: ['user-id-1', 'user-id-2'] },
        });
        await consumer.distributePostToFollowingPostsFeed(job);
        expect(
          consumer['distPostsToFollowingService']
            .distributePostToFollowingPostsFeed
        ).toHaveBeenCalledWith({
          postId: 'post-id',
          userIds: ['user-id-1', 'user-id-2'],
        });
      });

      it('should not throw error if post not found', async () => {
        // @ts-expect-error
        consumer[
          'distPostsToFollowingService'
        ].distributePostToFollowingPostsFeed = jest.fn(() =>
          err(new PostNotFoundException())
        );
        const job = JobFake({
          data: { postId: 'post-id', userIds: ['user-id-1', 'user-id-2'] },
        });
        await expect(
          consumer.distributePostToFollowingPostsFeed(job)
        ).resolves.toBeUndefined();
      });

      it('should throw error if internal server error', async () => {
        // @ts-expect-error
        consumer[
          'distPostsToFollowingService'
        ].distributePostToFollowingPostsFeed = jest.fn(() =>
          err(new PostgresTransactionFailedException())
        );
        const job = JobFake({
          data: { postId: 'post-id', userIds: ['user-id-1', 'user-id-2'] },
        });
        await expect(
          consumer.distributePostToFollowingPostsFeed(job)
        ).rejects.toThrow(PostgresTransactionFailedException);
      });
    }
  );
});
