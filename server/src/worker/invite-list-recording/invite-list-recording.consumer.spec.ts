import { InviteListService } from '@verdzie/server/invite-lists/invite-list.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { PostgresTransactionFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { InviteListRecordingConsumer } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.consumer';
import { InviteListRecordingJobData } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { err, ok } from 'neverthrow';

describe(InviteListRecordingConsumer.name, () => {
  describe(
    InviteListRecordingConsumer.prototype.processInviteListRecordingJob.name,
    () => {
      it('should call recordInvite', async () => {
        const invitesService = {
          recordInvite: jest.fn().mockResolvedValue(ok(true)),
        };
        const module = await createMockedTestingModule({
          providers: [
            InviteListRecordingConsumer,
            {
              provide: InviteListService,
              useValue: invitesService,
            },
          ],
        });
        const consumer = module.get(InviteListRecordingConsumer);
        const jobData: InviteListRecordingJobData = {
          referrerId: 'referrerId1',
          inviteeId: 'inviteeId1',
        };
        const job = JobFake({ data: jobData });
        await consumer.processInviteListRecordingJob(job);
        expect(invitesService.recordInvite).toHaveBeenCalledWith({
          referrerId: job.data.referrerId,
          invitedId: job.data.inviteeId,
        });
      });

      it('should throw error when recordInvite fails', async () => {
        const invitesService = {
          recordInvite: jest
            .fn()
            .mockResolvedValue(err(new PostgresTransactionFailedException())),
        };
        const module = await createMockedTestingModule({
          providers: [
            InviteListRecordingConsumer,
            {
              provide: InviteListService,
              useValue: invitesService,
            },
          ],
        });
        const consumer = module.get(InviteListRecordingConsumer);
        const jobData: InviteListRecordingJobData = {
          referrerId: 'referrerId1',
          inviteeId: 'inviteeId1',
        };
        const job = JobFake({ data: jobData });
        await expect(
          consumer.processInviteListRecordingJob(job)
        ).rejects.toThrowError('transaction failed');
      });
    }
  );
});
