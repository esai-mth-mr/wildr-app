import { Inject, Injectable } from '@nestjs/common';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import { PrepareUpdateUsersBatchProducer } from '@verdzie/server/worker/prepare-update-users-batch/prepareUpdateUsersBatch.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MiscSQSHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    // private readonly updateInviteCodeWorker: UpdateUsersInviteCountProducer,
    private readonly prepareUpdateUsersBatchWorker: PrepareUpdateUsersBatchProducer
  ) {
    this.logger = this.logger.child({ context: 'MiscSQSHandler' });
    if ((process.env.SQS_MISC_QUEUE_NAME ?? '') === '') {
      this.logger.error('SQS_MISC_QUEUE_NAME not specified');
    }
    if ((process.env.SQS_MISC_QUEUE_URL ?? '') === '') {
      this.logger.error('SQS_MISC_QUEUE_URL not specified');
    }
  }

  @SqsMessageHandler(process.env.SQS_MISC_QUEUE_NAME ?? '', /** batch: */ false)
  public async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('received Misc message', { ...message });
    this.logger.info('Body', { attrs: message.Body });
    if (message.Body) {
      const job: Job = JSON.parse(message.Body);
      switch (job.jobId) {
        case Jobs.SEND_EMAILS:
          try {
            const data: MiscJobDataSendInvites =
              job.data as MiscJobDataSendInvites;
            //Send emails
          } catch (error) {
            this.logger.error(error);
          }
          break;
        case Jobs.PREPARE_POST_AND_INTERESTS_FEEDS:
          try {
            await this.prepareUpdateUsersBatchWorker.prepareUpdateUsersBatch({
              jobEnum: job.jobId,
              input: job.data,
              batchSize: 1,
            });
          } catch (error) {
            this.logger.error(error);
          }
          break;
        case Jobs.MOVE_PROFILE_POSTS_TO_NEW_FEEDS:
          try {
            await this.prepareUpdateUsersBatchWorker.prepareUpdateUsersBatch({
              jobEnum: job.jobId,
              input: job.data,
              batchSize: 50,
            });
          } catch (error) {
            this.logger.error(error);
          }
          break;
        case Jobs.PREPARE_INITIAL_FEEDS:
          try {
            let shouldByPassBatching = false;
            if (job.data !== undefined) {
              if (job.data && 'emails' in job.data) {
                shouldByPassBatching = job.data.emails.length > 0;
              }
            }
            await this.prepareUpdateUsersBatchWorker.prepareUpdateUsersBatch({
              jobEnum: job.jobId,
              input: job.data,
              shouldByPassBatching,
            });
          } catch (error) {
            this.logger.error(error);
          }
          break;
        case Jobs.MOVE_CONSUMED_TO_EXPLORE:
          try {
            await this.prepareUpdateUsersBatchWorker.prepareUpdateUsersBatch({
              jobEnum: job.jobId,
              input: job.data,
              batchSize: 50,
            });
          } catch (error) {
            this.logger.error(error);
          }
          break;
        case Jobs.RE_INDEX_SEARCH_ALL_USERS:
          try {
            await this.prepareUpdateUsersBatchWorker.prepareUpdateUsersBatch({
              jobEnum: job.jobId,
              input: job.data,
              batchSize: 50,
            });
          } catch (error) {
            this.logger.error(error);
          }
          break;
        default:
          try {
            await this.prepareUpdateUsersBatchWorker.prepareUpdateUsersBatch({
              jobEnum: job.jobId as Jobs,
              input: job.data,
            });
          } catch (error) {
            this.logger.error(error);
          }
          break;
      }
    }
  }

  @SqsConsumerEventHandler(
    process.env.SQS_MISC_QUEUE_NAME ?? '',
    'processing_error'
  )
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('received error message: ', { error: error, ...message });
    this.logger.error(error);
  }

  @SqsConsumerEventHandler(process.env.SQS_MISC_QUEUE_NAME ?? '', 'error')
  public onError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onError: ', { error: error, ...message });
  }

  @SqsConsumerEventHandler(
    process.env.SQS_MISC_QUEUE_NAME ?? '',
    'timeout_error'
  )
  public onTimeoutError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onTimeoutError: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }
}

export interface MiscJobDataSendInvites {
  emails: string[];
}

export interface MiscJobDataUpdateCounts {
  handles: string[];
  count: number;
}

export interface MiscJobDataEmails {
  emails: string[];
}

export interface Job {
  jobId: string;
  data?: JobData;
}

export enum Jobs {
  SEND_EMAILS = 'SEND_EMAILS',
  UPDATE_INVITE_COUNT = 'UPDATE_INVITE_COUNT',
  PREPARE_POST_AND_INTERESTS_FEEDS = 'PREPARE_POST_AND_INTERESTS_FEEDS',
  MOVE_PROFILE_POSTS_TO_NEW_FEEDS = 'MOVE_PROFILE_POSTS_TO_NEW_FEEDS',
  PREPARE_INITIAL_FEEDS = 'PREPARE_INITIAL_FEEDS',
  MOVE_UNANNOTATED_POSTS_TO_ANNOTATION_PENDING_FEED = 'MOVE_UNANNOTATED_POSTS_TO_ANNOTATION_PENDING_FEED',
  MOVE_CONSUMED_TO_EXPLORE = 'MOVE_CONSUMED_TO_EXPLORE',
  RE_INDEX_SEARCH_ALL_USERS = 'RE_INDEX_SEARCH_ALL_USERS',
  CREATE_INNER_CIRCLE_LIST = 'CREATE_INNER_CIRCLE_LIST',
  CREATE_AND_FILL_PROPERTY_MAP = 'CREATE_AND_FILL_PROPERTY_MAP',
  CREATE_AND_FILL_IC_SUGGESTIONS_LIST = 'CREATE_AND_FILL_IC_SUGGESTIONS_LIST',
}

export type JobData =
  | MiscJobDataSendInvites
  | MiscJobDataUpdateCounts
  | MiscJobDataEmails
  | undefined;
