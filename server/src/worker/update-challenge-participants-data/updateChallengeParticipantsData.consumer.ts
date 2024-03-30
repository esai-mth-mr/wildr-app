import { Process, Processor } from '@nestjs/bull';
import {
  EDIT_CHALLENGE_DATE_JOB,
  EditChallengeDateJob,
  UPDATE_CHALLENGE_PARTICIPANTS_CHALLENGE_CONTEXT_JOB,
  UPDATE_CHALLENGE_PARTICIPANTS_DATA_QUEUE_NAME,
  UpdateChallengeParticipantsDataProducer,
  UpdateParticipantChallengeContextOnEditChallengeDateJob,
} from '@verdzie/server/worker/update-challenge-participants-data/updateChallengeParticipantsData.producer';
import { UserService } from '@verdzie/server/user/user.service';
import { Job } from 'bull';
import { FeedService } from '@verdzie/server/feed/feed.service';
import {
  fromChallengeParticipantIdString,
  getChallengeParticipantsFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { Repository } from 'typeorm';
import { updateStartOrEndDateInJoinedChallengeEntry } from '@verdzie/server/challenge/userJoinedChallenges.helper';
import _ from 'lodash';
import { notEmpty } from '@verdzie/server/common';

@Processor(UPDATE_CHALLENGE_PARTICIPANTS_DATA_QUEUE_NAME)
export class UpdateChallengeParticipantsDataConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly feedService: FeedService,
    private readonly updateChallengeParticipantsDataProducer: UpdateChallengeParticipantsDataProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(EDIT_CHALLENGE_DATE_JOB)
  async prepareBatches(job: Job<EditChallengeDateJob>) {
    this.logger.info('Prepare Batches');
    const feed = await this.feedService.find(
      getChallengeParticipantsFeedId(job.data.challengeId)
    );
    if (!feed) {
      this.logger.warn('Challenge participants feed not found');
      return;
    }
    const batches = _.chunk(feed.ids, 10);
    for (let index = 0; index < batches.length; index++) {
      const userIds = batches[index]
        .map(entryStr => {
          const entry = fromChallengeParticipantIdString(entryStr);
          if (!entry) return undefined;
          return entry.id;
        })
        .filter(notEmpty);
      this.updateChallengeParticipantsDataProducer.updateParticipantChallengeContextOnEditChallengeDate(
        {
          userIds,
          ...job.data,
        },
        { delay: 5 * index + Math.random() * 10 }
      );
    }
  }

  @Process(UPDATE_CHALLENGE_PARTICIPANTS_CHALLENGE_CONTEXT_JOB)
  async updateParticipantsChallengeContext(
    job: Job<UpdateParticipantChallengeContextOnEditChallengeDateJob>
  ) {
    await this.userService.repo.manager.transaction(async manager => {
      const userRepo: Repository<UserEntity> =
        manager.getRepository(UserEntity);
      const users = await userRepo.findByIds(job.data.userIds, {
        lock: { mode: 'pessimistic_write' },
      });
      const startDate = !!job.data.startDate
        ? new Date(job.data.startDate)
        : undefined;
      const endDate = !!job.data.endDate
        ? new Date(job.data.endDate)
        : undefined;
      const jobs = [];
      for (const user of users) {
        this.logger.debug('Updating user', {
          id: user.id,
          handle: user.handle,
          job: job.data,
          typeOfStartDate: typeof job.data.startDate,
        });
        const updatedUser = updateStartOrEndDateInJoinedChallengeEntry({
          user,
          logger: this.logger,
          challengeId: job.data.challengeId,
          startDate,
          endDate,
        });
        if (!updatedUser) {
          this.logger.warn('Updated user is null');
          continue;
        }
        jobs.push(
          userRepo.update(user.id, {
            challengeContext: updatedUser.challengeContext,
          })
        );
      } //end of loop
      if (jobs.length) {
        await Promise.all(jobs);
      }
    });
  }
}
