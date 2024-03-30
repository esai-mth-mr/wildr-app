import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { PostService } from '@verdzie/server/post/post.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import {
  DistributeAnnotatedPostJob,
  DistributeAnnotatedPostProducer,
} from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.producer';
import { RankAndDistributePostProducer } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Like, Raw } from 'typeorm';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';

const BATCH_SIZE = 100;

@Processor('distribute-annotated-posts-queue')
export class DistributeAnnotatedPostConsumer {
  private readonly distributeOptimizedPath: boolean;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly postService: PostService,
    private readonly userService: UserService,
    private readonly feedService: FeedService,
    private readonly rankAndDistributePostWorker: RankAndDistributePostProducer,
    private readonly worker: DistributeAnnotatedPostProducer
  ) {
    console.info('DistributeAnnotatedPostConsumer created');
    this.logger = this.logger.child({
      context: 'DistributeAnnotatedPostsConsumer',
    });
    // this.distributeOptimizedPath = process.env.DISTRBUTE_OPTIMIZED_PATH === 'true';
    this.distributeOptimizedPath = true;
  }

  async removePostFromAnnotatedDistributionInProgressList(postId: string) {
    this.logger.info('removePostFromAnnotatedDistributionInProgressList()', {
      postId,
    });
    const inProgressFeed =
      await this.feedService.getAnnotatedDistributionInProgressPostsFeed();
    const index = inProgressFeed.page.ids.indexOf(postId);
    if (index === -1) {
      const annotatedUndistributedPostsFeed =
        await this.feedService.getAnnotatedUndistributedPostsFeed();
      annotatedUndistributedPostsFeed.page.ids.splice(
        inProgressFeed.page.ids.indexOf(postId),
        1
      );
      await this.feedService.save([annotatedUndistributedPostsFeed]);
    } else {
      inProgressFeed.page.ids.splice(
        inProgressFeed.page.ids.indexOf(postId),
        1
      );
      await this.feedService.save([inProgressFeed]);
    }
  }

  @Process('distribute-annotated-post-job')
  async distributeAnnotatedPost(job: Job<DistributeAnnotatedPostJob>) {
    //Get all the users and distribute to them
    const post = await this.postService.findWithAuthorRelation(job.data.postId);
    if (!post) {
      this.logger.error('Post Not found', { postId: job.data.postId });
      return;
    }
    const postId = post.id;
    const followersFeed = await this.feedService.find(
      // toFeedId(FeedEntityType.FOLLOWER, post.authorId)
      post.author!.followerFeedId ?? ''
    );
    const followersSet: Set<string> = new Set<string>(followersFeed?.page.ids);
    //Convert into set
    if (post.isPrivate) {
      if (!followersFeed) {
        this.logger.info('Followers Feed not found', {
          postId,
          authorId: post.authorId,
        });
        return;
      }
      // Iterate through the list in the batches
      const end = (job.data.skip ?? 0) + BATCH_SIZE;
      const userIds = followersFeed.page.ids.slice(job.data.skip, end);
      if (userIds.length === 0) {
        this.logger.info('userIds is empty');
        await this.removePostFromAnnotatedDistributionInProgressList(
          job.data.postId
        );
        return;
      }
      for (const userId of userIds) {
        await this.rankAndDistributePostWorker.rankAndDistribute({
          userId,
          postId: post.id,
          isFollower: true,
        });
      }
      await this.worker.distributeAnnotatedPost({
        postId: job.data.postId,
        skip: end,
        followersListEndCursor: userIds[userIds.length - 1],
      });
    } else if (this.distributeOptimizedPath) {
      this.logger.info('Ranking and Distributing via Optimized Path');
      try {
        //Read CategoryInterestsFeed by user (using FeedEntity)
        const categoryIdsStr = (post.categoryIds ?? [])
          .map(catId => `'${catId}'`)
          .join(',');
        //Using JSON functions on PSQL -> https://www.postgresql.org/docs/9.5/functions-json.html
        const feeds = await this.feedService.repo
          .createQueryBuilder('feed_entity')
          .where(
            {
              id: Like(`${FeedEntityType.USER_CATEGORY_INTERESTS}:%`),
              page: Raw(
                page =>
                  `((${page} ->> 'idsWithScore')::jsonb->>'idsMap')::jsonb ?| array [${categoryIdsStr}]`
              ),
            },
            {}
          )
          .select("split_part(feed_entity.id, ':', 2) as userid")
          .getRawMany();
        const userIds = feeds.map(x => x.userid);
        let delay = 5000;
        for (const userId of userIds) {
          delay += 2000 + Math.floor(Math.random() * 5000);
          await this.rankAndDistributePostWorker.rankAndDistribute(
            {
              postId,
              userId,
              isFollower: followersSet.has(userId),
            },
            { delay }
          );
        }
        await this.removePostFromAnnotatedDistributionInProgressList(
          job.data.postId
        );
      } catch (error) {
        this.logger.error('Error while distributing via Optimized Path', {
          postId,
        });
        console.log(error);
      }
    } else {
      this.logger.debug('iterate through UserEntity', { job });
      try {
        const userEntities: UserEntity[] = await this.userService.repo
          .createQueryBuilder('user_entity')
          .take(BATCH_SIZE)
          .skip(job.data.skip)
          .orderBy('created_at', 'ASC')
          .getMany();
        this.logger.info('BatchEntitiesSize', { size: userEntities.length });
        if (userEntities.length == 0) {
          this.logger.info('userIds is empty');
          await this.removePostFromAnnotatedDistributionInProgressList(
            job.data.postId
          );
          return;
        }
        for (const user of userEntities) {
          await this.rankAndDistributePostWorker.rankAndDistribute({
            userId: user.id,
            postId: post.id,
            isFollower: followersSet.has(user.id),
          });
        } //end of forLoop
        //Keep on looping through batches
        await this.worker.distributeAnnotatedPost({
          postId: job.data.postId,
          skip: (job.data.skip ?? 0) + userEntities.length,
        });
      } catch (e) {
        this.logger.error(e);
        //TODO: SHOULD I?
        // await this.worker.distributeAnnotatedPost({
        //   postId: job.data.postId,
        //   skip: job.data.skip,
        // })
      }
    }
  }
}
