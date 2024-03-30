import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { BadSQSMessageException } from '@verdzie/server/sqs/errors';
import { IsIn, validate } from 'class-validator';
import { Result, err, ok } from 'neverthrow';

export type GlobalChallengeFeedEnums = FeedEntityType.GLOBAL_ACTIVE_CHALLENGES;

export class PruneGlobalChallengesFeedMessageDto {
  @IsIn([FeedEntityType.GLOBAL_ACTIVE_CHALLENGES])
  feed: GlobalChallengeFeedEnums;

  constructor(feed: GlobalChallengeFeedEnums) {
    this.feed = feed;
  }

  static async create(
    body: any
  ): Promise<
    Result<PruneGlobalChallengesFeedMessageDto, BadSQSMessageException>
  > {
    try {
      const parsed = JSON.parse(body);
      const dto = new PruneGlobalChallengesFeedMessageDto(parsed.feed);
      const errors = await validate(dto);
      if (errors.length > 0)
        return err(new BadSQSMessageException({ body, errors }));
      return ok(dto);
    } catch (error) {
      return err(new BadSQSMessageException({ error, body }));
    }
  }
}
