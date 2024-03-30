import { getQueueToken } from '@nestjs/bull';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  INVITE_LIST_RECORDING_JOB_NAME,
  INVITE_LIST_RECORDING_QUEUE_NAME,
  InviteListRecordingJobData,
  InviteListRecordingProducer,
} from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer';

describe(InviteListRecordingProducer.name, () => {
  describe(
    InviteListRecordingProducer.prototype.createInviteListRecordingJob.name,
    () => {
      it('should produce a job', async () => {
        const module = await createMockedTestingModule({
          providers: [
            InviteListRecordingProducer,
            {
              provide: getQueueToken(INVITE_LIST_RECORDING_QUEUE_NAME),
              useValue: {
                add: jest.fn(),
                on: jest.fn(),
              },
            },
          ],
        });
        const producer = module.get(InviteListRecordingProducer);
        const jobData: InviteListRecordingJobData = {
          referrerId: 'referrerId1',
          inviteeId: 'inviteeId1',
        };
        const result = await producer.createInviteListRecordingJob(jobData);
        expect(result.isOk()).toBe(true);
      });

      it('should produce a job with correct data', async () => {
        const add = jest.fn();
        const module = await createMockedTestingModule({
          providers: [
            InviteListRecordingProducer,
            {
              provide: getQueueToken(INVITE_LIST_RECORDING_QUEUE_NAME),
              useValue: {
                add,
                on: jest.fn(),
              },
            },
          ],
        });
        const producer = module.get(InviteListRecordingProducer);
        const jobData: InviteListRecordingJobData = {
          referrerId: 'referrerId1',
          inviteeId: 'inviteeId1',
        };
        const result = await producer.createInviteListRecordingJob(jobData);
        expect(result.isOk()).toBe(true);
        expect(add).toHaveBeenCalledWith(
          INVITE_LIST_RECORDING_JOB_NAME,
          jobData
        );
      });
    }
  );
});
