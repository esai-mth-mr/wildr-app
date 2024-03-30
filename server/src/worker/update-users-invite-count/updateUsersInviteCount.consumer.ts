import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { UserService } from '@verdzie/server/user/user.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  UpdateUsersInviteCountJob,
  UpdateUsersInviteCountProducer,
} from './updateUsersInviteCount.producer';
import { In } from 'typeorm';
import { UserEntity } from '@verdzie/server/user/user.entity';

@Processor('update-users-invite-count-queue')
export class UpdateUsersInviteCountConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly updateInviteCodeWorker: UpdateUsersInviteCountProducer
  ) {
    this.logger = this.logger.child({
      context: 'UpdateUsersInviteCountConsumer',
    });
  }

  @Process('update-users-invite-count-job')
  async updateInviteCount(job: Job<UpdateUsersInviteCountJob>) {
    try {
      if (job.data.handles && job.data.handles.length > 0) {
        const result = await this.userService.repo.update(
          { handle: In(job.data.handles) },
          { inviteCount: job.data.count ?? 5 }
        );
        this.logger.debug(`Updated handles ${job.data.handles}`, { result });
      } else {
        // Update all users
        const totalUserCount = await this.userService.repo.count();
        const batchCount = 1000;
        for (
          let skipCount = 0;
          skipCount <= totalUserCount;
          skipCount = Math.min(totalUserCount, skipCount + batchCount)
        ) {
          try {
            const entities = await this.userService.repo
              .createQueryBuilder('user_entity')
              .take(batchCount)
              .skip(skipCount)
              .orderBy('created_at')
              .getMany();
            if (entities.length == 0) {
              break;
            }
            const result = await this.userService.repo.update(
              entities.map(entity => entity.id),
              { inviteCount: job.data.count ?? 5 }
            );
            this.logger.debug('Result = ', { result });
          } catch (e) {
            this.logger.error(e);
          }
          if (skipCount == totalUserCount) break;
        }
      }
    } catch (error) {
      this.logger.error('Failed to updateInviteCount', error);
    }
  }
}
