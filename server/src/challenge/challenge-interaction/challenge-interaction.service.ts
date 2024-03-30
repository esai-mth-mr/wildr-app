import { Inject, Injectable } from '@nestjs/common';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { AppContext, getStartAndEndDateInUTC } from '@verdzie/server/common';
import { withSerializationRetries } from '@verdzie/server/common/with-serialization-retries';
import { getFirstPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export type ChallengeInteractionEdge = string;
export type ChallengeInteraction = {
  dateMs: number;
  interactionType: ChallengeInteractionEnum;
  objectId: string;
};

export enum ChallengeInteractionEnum {
  COMMENTED,
  REPLIED,
  PINNED_ENTRY,
  PINNED_COMMENT,
  REACTED_TO_ENTRY,
  REACTED_TO_COMMENT,
  REACTED_TO_REPLY,
}

@Injectable()
export class ChallengeInteractionService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  toChallengeInteractionEdge({
    interactionType,
    objectId,
  }: {
    interactionType: ChallengeInteractionEnum;
    objectId: string;
  }): ChallengeInteractionEdge {
    return JSON.stringify({
      dateMs: Date.now(),
      interactionType,
      objectId,
    });
  }

  fromChallengeInteractionEdge(
    edge: ChallengeInteractionEdge
  ): ChallengeInteraction {
    return JSON.parse(edge);
  }

  addChallengeInteractionToFeed({
    feed,
    objectId,
    interactionType,
  }: {
    feed: FeedEntity;
    objectId: string;
    interactionType: ChallengeInteractionEnum;
  }): FeedEntity {
    feed.page.ids.push(
      this.toChallengeInteractionEdge({
        interactionType,
        objectId,
      })
    );
    feed.count = feed.page.ids.length;
    return feed;
  }

  getChallengeInteractionsForTodayFromFeed({
    feed,
    timezoneOffset,
  }: {
    feed: FeedEntity;
    timezoneOffset: string;
  }): ChallengeInteractionEdge[] {
    const { startDate, endDate } = getStartAndEndDateInUTC(timezoneOffset);
    return feed.page.ids.filter(id => {
      const challengeInteraction = this.fromChallengeInteractionEdge(id);
      if (
        challengeInteraction.dateMs <= endDate.getTime() &&
        challengeInteraction.dateMs >= startDate.getTime()
      ) {
        return true;
      } else {
        return false;
      }
    });
  }

  getChallengeAuthorInteractionFeedId({
    challengeId,
    userId,
  }: {
    challengeId: string;
    userId: string;
  }): string {
    return getFirstPageId(
      toFeedId(
        FeedEntityType.CHALLENGE_AUTHOR_INTERACTIONS,
        challengeId,
        userId
      )
    );
  }

  async updateChallengeInteractionsIfAuthor({
    postOrChallenge,
    currentUser,
    objectId,
    interactionType,
    context,
  }: {
    postOrChallenge: PostEntity | ChallengeEntity;
    currentUser: UserEntity;
    objectId: string;
    interactionType: ChallengeInteractionEnum;
    context: AppContext;
  }): Promise<{ interactionAdded: boolean }> {
    this.logger.debug('[updateChallengeInteractionsIfAuthor]');
    if (currentUser.getComputedStats().createdChallengesCount === 0) {
      this.logger.debug(
        '[updateChallengeInteractionsIfAuthor] no created challenges',
        { userId: currentUser.id }
      );
      return { interactionAdded: false };
    }
    let challenge: ChallengeEntity | undefined;
    if (postOrChallenge instanceof ChallengeEntity) {
      challenge = postOrChallenge;
    } else if (postOrChallenge instanceof PostEntity) {
      if (!postOrChallenge.parentChallengeId) {
        this.logger.debug(
          '[updateChallengeInteractionsIfAuthor] no parent challenge',
          {
            postId: postOrChallenge.id,
            userId: currentUser.id,
          }
        );
        return { interactionAdded: false };
      } else if (postOrChallenge.parentChallenge) {
        challenge = postOrChallenge.parentChallenge;
      } else {
        challenge = await this.feedService.repo.manager
          .getRepository(ChallengeEntity)
          .findOne({
            id: postOrChallenge.parentChallengeId,
          });
      }
    }
    if (!challenge) {
      this.logger.warn(
        '[updateChallengeInteractionsIfAuthor] no challenge found',
        {
          postOrChallengeId: postOrChallenge.id,
          userId: currentUser.id,
        }
      );
      return { interactionAdded: false };
    }
    if (challenge.authorId !== currentUser.id) {
      this.logger.debug(
        '[updateChallengeInteractionsIfAuthor] not author of challenge'
      );
      return { interactionAdded: false };
    }
    const feedId = this.getChallengeAuthorInteractionFeedId({
      challengeId: challenge.id,
      userId: currentUser.id,
    });
    const feed = await withSerializationRetries(
      () =>
        this.feedService.repo.manager.transaction(
          'READ COMMITTED',
          async manager => {
            const feedRepo = manager.getRepository(FeedEntity);
            const feed = await feedRepo.findOne(feedId);
            if (!feed) {
              const newFeed = new FeedEntity();
              newFeed.id = feedId;
              this.addChallengeInteractionToFeed({
                feed: newFeed,
                objectId,
                interactionType,
              });
              await feedRepo.insert(newFeed);
              return newFeed;
            }
            this.addChallengeInteractionToFeed({
              feed,
              objectId,
              interactionType,
            });
            await feedRepo.update(feedId, feed);
            return feed;
          }
        ),
      1,
      this
    )();
    this.logger.info(
      '[updateChallengeInteractionsIfAuthor] interaction added',
      {
        userId: currentUser.id,
        interactionType,
      }
    );
    context.challenges[challenge.id] = challenge;
    context.challengeInteractionData.challenge = challenge;
    context.challengeInteractionData.interactionCount = feed.count;
    return { interactionAdded: true };
  }

  async getChallengeAuthorInteractionsForToday({
    currentUser,
    challengeId,
    timezoneOffset: timezone,
  }: {
    currentUser: UserEntity;
    challengeId: string;
    timezoneOffset: string;
  }): Promise<ChallengeInteraction[]> {
    const feedId = this.getChallengeAuthorInteractionFeedId({
      challengeId,
      userId: currentUser.id,
    });
    const feed = await this.feedService.repo.findOne(feedId);
    if (!feed) return [];
    return this.getChallengeInteractionsForTodayFromFeed({
      feed,
      timezoneOffset: timezone,
    }).map(interaction => this.fromChallengeInteractionEdge(interaction));
  }
}
