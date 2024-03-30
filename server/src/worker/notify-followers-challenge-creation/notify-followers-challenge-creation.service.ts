import { Inject, Injectable } from '@nestjs/common';
import { ActivityService } from '@verdzie/server/activity/activity.service';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { getFirstPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { UserService } from '@verdzie/server/user/user.service';
import { NotifyFollowersOfChallengeCreationProducer } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.producer';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

const FOLLOWER_BATCH_SIZE = 50;

@Injectable()
export class NotifyFollowersOfChallengeCreationService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService,
    private readonly challengeService: ChallengeService,
    private readonly notifyFollowersOfChallengeCreationProducer: NotifyFollowersOfChallengeCreationProducer,
    private readonly userService: UserService,
    private readonly activityService: ActivityService
  ) {}

  async notifyAllFollowers({
    challengeId,
  }: {
    challengeId: string;
  }): Promise<void> {
    const challenge = await this.challengeService.findById({ id: challengeId });
    if (!challenge) {
      this.logger.error(
        '[notifyFollowersOfChallengeCreation] challenge not found',
        { challengeId }
      );
      return;
    }
    const [author, authorFollowersFeeds] = await Promise.all([
      this.userService.findById(challenge.authorId),
      this.feedService.findAllPagesById(
        getFirstPageId(toFeedId(FeedEntityType.FOLLOWER, challenge.authorId))
      ),
    ]);
    if (!author) {
      this.logger.error(
        '[notifyFollowersOfChallengeCreation] challenge author not found',
        { challengeId, authorId: challenge.authorId }
      );
      return;
    }
    if (!authorFollowersFeeds || !authorFollowersFeeds.length) {
      this.logger.warn(
        '[notifyFollowersOfChallengeCreation] challenge author followers feed not found',
        { challengeId, authorId: challenge.authorId }
      );
      return;
    }
    const authorFollowersFeedChunks: string[][] = [];
    for (const feed of authorFollowersFeeds) {
      authorFollowersFeedChunks.push(
        ..._.chunk(feed.page.ids, FOLLOWER_BATCH_SIZE)
      );
    }
    const followerBatchCreationPromises = [];
    for (let i = 0; i < authorFollowersFeedChunks.length; i++) {
      followerBatchCreationPromises.push(
        this.notifyFollowersOfChallengeCreationProducer.notifyFollowerBatch({
          jobData: { challengeId, followerIds: authorFollowersFeedChunks[i] },
          options: { delay: i * 250 },
        })
      );
    }
    const result = await Promise.allSettled(followerBatchCreationPromises);
    result.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error('[notifyFollowersOfChallengeCreation] failed', {
          challengeId,
          reason: r.reason,
          feedChunk: authorFollowersFeedChunks[i],
        });
      }
    });
  }

  async notifyFollowerBatch({
    challengeId,
    followerIds,
  }: {
    challengeId: string;
    followerIds: string[];
  }): Promise<void> {
    const result = await Promise.allSettled(
      followerIds.map(followerId =>
        this.activityService.followeeCreatedChallenge({
          challengeId,
          followerId,
        })
      )
    );
    result.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error('[notifyFollowerBatchOfChallengeCreation] failed', {
          challengeId,
          reason: r.reason,
          followerId: followerIds[i],
        });
      }
    });
  }
}
