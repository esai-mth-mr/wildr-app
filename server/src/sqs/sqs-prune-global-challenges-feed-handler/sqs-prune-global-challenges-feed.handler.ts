import { Inject, Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { PruneGlobalChallengesFeedMessageDto } from '@verdzie/server/sqs/sqs-prune-global-challenges-feed-handler/prune-global-challenges-message.dto';
import { GlobalChallengeFeedPruningProducer } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SqsPruneGlobalChallengesFeedHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly globalChallengeFeedPruningProducer: GlobalChallengeFeedPruningProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @SqsMessageHandler(
    process.env.SQS_PRUNE_CHALLENGES_GLOBAL_FEED_QUEUE_NAME ?? '',
    false
  )
  async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('received sqs message: ', { ...message });
    const messageDtoResult = await PruneGlobalChallengesFeedMessageDto.create(
      message.Body
    );
    if (messageDtoResult.isErr()) {
      this.logger.error('invalid sqs message', {
        error: messageDtoResult.error,
      });
      return;
    }
    await this.globalChallengeFeedPruningProducer.createBatchJobs({
      globalChallengeFeedType: messageDtoResult.value.feed,
    });
  }
}
