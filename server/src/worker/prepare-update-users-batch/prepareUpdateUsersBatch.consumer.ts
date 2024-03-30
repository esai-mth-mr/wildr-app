import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserService } from '@verdzie/server/user/user.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrepareUpdateUsersBatchJob } from '@verdzie/server/worker/prepare-update-users-batch/prepareUpdateUsersBatch.producer';
import { UpdateUsersInBatchProducer } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.producer';

@Processor('prepare-update-users-batch-queue')
export class PrepareUpdateUsersBatchConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly updateUsersInBatchProducer: UpdateUsersInBatchProducer
  ) {
    this.logger = this.logger.child({ context: 'BatchUpdateUsersConsumer' });
  }

  @Process('prepare-update-users-batch-job')
  async prepareBatchAndSendJobs(job: Job<PrepareUpdateUsersBatchJob>) {
    if (job.data.shouldByPassBatching) {
      try {
        await this.updateUsersInBatchProducer.updateUsersInBatch({
          jobEnum: job.data.jobEnum,
          input: job.data.input,
          isFinal: true,
        });
      } catch (e) {
        this.logger.error(e);
      }
      return;
    }
    const totalUserCount = await this.userService.repo.count();
    const batchSize = job.data.batchSize ?? 1000;
    for (
      let skip = 0;
      skip <= totalUserCount;
      skip = Math.min(totalUserCount, skip + batchSize)
    ) {
      //send batch job to worker
      if (skip == totalUserCount) break;
      try {
        await this.updateUsersInBatchProducer.updateUsersInBatch({
          skip,
          take: batchSize,
          jobEnum: job.data.jobEnum,
          input: job.data.input,
          isFinal: skip == totalUserCount,
        });
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
}
