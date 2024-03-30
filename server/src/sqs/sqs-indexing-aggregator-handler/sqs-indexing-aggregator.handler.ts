import { Inject, Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { OSIndexingAggregatorService } from '@verdzie/server/open-search-v2/indexing-aggregator/indexing-aggregator.service';
import { IndexingJobType } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { IndexMessageDto } from '@verdzie/server/sqs/sqs-indexing-aggregator-handler/re-index-message.dto';
import { validate } from 'class-validator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SqsIndexingAggregatorHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly indexingAggregatorService: OSIndexingAggregatorService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @SqsMessageHandler(
    process.env.SQS_INDEXING_AGGREGATOR_QUEUE_NAME ?? '',
    false
  )
  async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('[handleMessage] received sqs message: ', { ...message });
    const messageDto = new IndexMessageDto(message.Body);
    const errors = await validate(messageDto);
    if (errors.length > 0) {
      this.logger.error('[handleMessage] invalid message: ', {
        messageDto,
        errors,
      });
      return;
    }
    try {
      switch (messageDto.jobType) {
        case IndexingJobType.RE_INDEX:
          await this.indexingAggregatorService.createAggregatedJobs(
            messageDto.entityName,
            IndexingJobType.RE_INDEX
          );
          break;
        case IndexingJobType.INCREMENTAL_INDEX:
          await this.indexingAggregatorService.createAggregatedJobs(
            messageDto.entityName,
            IndexingJobType.INCREMENTAL_INDEX
          );
          break;
        default:
          const _exhaustiveCheck: never = messageDto.jobType;
      }
    } catch (e) {
      this.logger.error('[handleMessage] failed to create aggregated jobs', {
        messageDto,
        error: e,
      });
      return;
    }
    this.logger.info('[handleMessage] aggregated jobs successfully', {
      messageDto,
    });
  }
}
