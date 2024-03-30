import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class ScoreDataProducer {
  constructor(
    @InjectQueue('score-data-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  async updateUserScoreData(job: UpdateScoreDataJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'update-score-data-job',
      job
    );
  }
}

export interface UpdateScoreDataJob {
  userId: string;
  action: UserScoreDataRelatedActionEnum;
}

export enum UserScoreDataRelatedActionEnum {
  REC_REAL_REACTION,
  REC_APPLAUD_REACTION,
  REC_LIKE_REACTION,
  REC_UN_REAL_REACTION,
  REC_UN_APPLAUD_REACTION,
  REC_UN_LIKE_REACTION,
  FOLLOWER_GAINED,
  FOLLOWER_LOST,
  REC_POST_REPOST,
  REC_REPORT_POST,
  REC_REPORT_COMMENT,
  REC_REPORT_REPLY,
  REPORTED_SOMEONE,
  REPORTED_POST,
  REPORTED_COMMENT,
  REPORTED_REPLY,
  FALSE_REPORTED_SOMEONE,
}
