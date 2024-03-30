import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { fromTransaction } from '@verdzie/server/common/transaction-result';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import {
  FeedEntity,
  FeedEntityType,
  FollowingUserPostsFeedBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostNotFoundException } from '@verdzie/server/post/post.exceptions';
import { PostService } from '@verdzie/server/post/post.service';
import {
  PostgresQueryFailedException,
  PostgresTransactionFailedException,
  PostgresUpdateFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { JobProductionException } from '@verdzie/server/worker/common/wildrProducer';
import { DistributePostToFollowingPostsJobData } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeedWorker.config';
import { NotifyFollowersAboutPostsProducer } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPosts.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, fromPromise, ok } from 'neverthrow';
import { Connection } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class DistributePostsToFollowingPostsFeedService {
  private readonly canNotifyFollowers: boolean;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService,
    private readonly postService: PostService,
    private readonly notifyFollowersAboutPostWorker: NotifyFollowersAboutPostsProducer,
    @InjectConnection()
    private readonly connection: Connection
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    this.canNotifyFollowers = process.env.SHOULD_NOTIFY_FOLLOWERS === 'true';
  }

  async distributePostToFollowingPostsFeed(
    job: DistributePostToFollowingPostsJobData
  ): Promise<
    Result<
      boolean,
      | PostNotFoundException
      | PostgresTransactionFailedException
      | PostgresQueryFailedException
      | InternalServerErrorException
      | JobProductionException
    >
  > {
    const logContext = {
      postId: job.postId,
      data: job,
      methodName: this.distributePostToFollowingPostsFeed.name,
    };
    this.logger.info('distributing post to follower feed', logContext);
    const post = await fromPromise(
      this.postService.findById(job.postId),
      error => new PostgresQueryFailedException({ error })
    );
    if (post.isErr()) {
      this.logger.error('error while fetching post', {
        ...logContext,
        error: post.error,
      });
      return err(post.error);
    }
    if (!post.value) {
      this.logger.warn('post not found distributing to followers', logContext);
      return err(new PostNotFoundException(logContext));
    }
    const result = await this.addPostToPostsTypeFeed({
      post: post.value,
      userIds: job.userIds,
    });
    if (result.isErr()) {
      this.logger.error(`error while adding post to feeds`, {
        ...logContext,
        error: result.error,
      });
      return result;
    }
    if (job.shouldNotifyFollowers) {
      const notificationResult = await this.notifyFollowers({
        followerIds: job.userIds,
        post: post.value,
        userIdsToSkip: job.userIdsToSkip,
      });
      if (notificationResult.isErr()) {
        this.logger.error('error while notifying followers', {
          ...logContext,
          error: notificationResult.error,
        });
        return err(notificationResult.error);
      }
    }
    this.logger.info('done distributing posts', { data: job.postId });
    return ok(true);
  }

  private async addPostToPostsTypeFeed({
    userIds,
    post,
  }: {
    post: PostEntity;
    userIds: string[];
  }): Promise<
    Result<
      boolean,
      | PostgresQueryFailedException
      | PostgresTransactionFailedException
      | InternalServerErrorException
    >
  > {
    const logContext = {
      postId: post.id,
      userIds,
      methodName: this.addPostToPostsTypeFeed.name,
    };
    const feedIds: string[] = [];
    for (const userId of userIds) {
      feedIds.push(
        toFeedId(FollowingUserPostsFeedBasedOnPostTypes[post.type], userId),
        toFeedId(FeedEntityType.FOLLOWING_USERS_ALL_POSTS, userId)
      );
    }
    const feedCreationResult = await this.feedService.createManyIfNotExists({
      feedIds,
    });
    if (feedCreationResult.isErr()) {
      this.logger.error('error while creating feeds', {
        ...logContext,
        error: feedCreationResult.error,
      });
      return feedCreationResult;
    }
    const queryRunner = this.connection.createQueryRunner();
    return await fromTransaction<
      boolean,
      PostgresUpdateFailedException | PostgresQueryFailedException
    >({
      queryRunner,
      context: logContext,
      txn: async ({ queryRunner }) => {
        const feedRepo = queryRunner.manager.getRepository(FeedEntity);
        const feedResult = await fromPromise(
          feedRepo.findByIds(feedIds),
          error => new PostgresQueryFailedException({ error })
        );
        if (feedResult.isErr()) {
          this.logger.error('error while fetching feeds', {
            ...logContext,
            error: feedResult.error,
          });
          return err(feedResult.error);
        }
        if (feedResult.value.length !== feedIds.length) {
          this.logger.warn('missing feeds distributing posts', {
            ...logContext,
            missingFeeds: feedIds.filter(
              feedId => !feedResult.value.find(feed => feed.id === feedId)?.id
            ),
            feedResult: feedResult.value,
          });
        }
        const tasks: Promise<any>[] = [];
        for (const feed of feedResult.value) {
          feed.unshiftToFeedSet(post.id);
          tasks.push(feedRepo.update(feed.id, feed));
        }
        const updateResult = await Promise.all(tasks)
          .then(() => ok(true))
          .catch(error => err(new PostgresUpdateFailedException({ error })));
        if (updateResult.isErr()) {
          this.logger.error('error while updating feeds', {
            ...logContext,
            error: updateResult.error,
          });
          return err(updateResult.error);
        }
        return ok(true);
      },
      logger: this.logger,
    });
  }

  private async notifyFollowers({
    followerIds,
    post,
    userIdsToSkip,
  }: {
    followerIds: string[];
    post: PostEntity;
    userIdsToSkip?: string[];
  }): Promise<Result<boolean, JobProductionException>> {
    const logContext = {
      postId: post.id,
      followerIds,
      userIdsToSkip,
      methodName: this.notifyFollowers.name,
    };
    if (!this.canNotifyFollowers) {
      this.logger.info('not notifying followers of new post', logContext);
      return ok(true);
    }
    this.logger.info('notifying followers of post', logContext);
    if (userIdsToSkip)
      followerIds = followerIds.filter(id => !userIdsToSkip.includes(id));
    const notifyResult = await fromPromise(
      this.notifyFollowersAboutPostWorker.notifyFollowersAboutPosts({
        postId: post.id,
        followerIds,
      }),
      error => new JobProductionException({ error })
    );
    if (notifyResult.isErr()) {
      this.logger.error('error creating follower notification job', {
        ...logContext,
        error: notifyResult.error,
      });
      return err(notifyResult.error);
    }
    return ok(true);
  }
}
