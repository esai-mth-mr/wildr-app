import { getRepositoryToken } from '@nestjs/typeorm';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { getFirstFeedPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedSchema } from '@verdzie/server/feed/feed.schema';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { ChallengeCreatorDailyNotificationConfig } from '@verdzie/server/notification-scheduler/notification-config/configs/challenge-creator-daily-notification.config';
import {
  createMockRepo,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { add, sub } from 'date-fns';
import { ok } from 'neverthrow';

describe(ChallengeCreatorDailyNotificationConfig.name, () => {
  describe('getStartAndEnd', () => {
    let config: ChallengeCreatorDailyNotificationConfig;

    beforeEach(async () => {
      config = (
        await createMockedTestingModule({
          providers: [
            ChallengeCreatorDailyNotificationConfig,
            {
              provide: getRepositoryToken(ChallengeSchema),
              useValue: createMockRepo({ entities: [] }),
            },
            {
              provide: getRepositoryToken(FeedSchema),
              useValue: createMockRepo({ entities: [] }),
            },
          ],
        })
      ).get(ChallengeCreatorDailyNotificationConfig);
    });

    it('should return the start and end from the parent challenge', async () => {
      const challenge = ChallengeEntityFake();
      challenge.startDate = new Date('2021-01-01');
      challenge.endDate = new Date('2021-01-10');
      // @ts-ignore
      config['challengeRepository'] = createMockRepo({
        entities: [challenge],
      });
      const result = await config.getStartAndEnd({
        parentId: challenge.id,
      });
      expect(result).toEqual(
        ok({
          start: sub(new Date('2021-01-01'), { days: 1 }),
          end: add(new Date('2021-01-10'), { days: 1 }),
        })
      );
    });

    it('should return an error if the parent challenge is not found', async () => {
      const result = await config.getStartAndEnd({
        parentId: 'fake-id',
      });
      expect(result.isErr()).toBe(true);
    });
  });

  describe('getNotificationData', () => {
    let config: ChallengeCreatorDailyNotificationConfig;

    beforeEach(async () => {
      config = (
        await createMockedTestingModule({
          providers: [
            ChallengeCreatorDailyNotificationConfig,
            {
              provide: getRepositoryToken(ChallengeSchema),
              useValue: createMockRepo({ entities: [] }),
            },
            {
              provide: getRepositoryToken(FeedSchema),
              useValue: createMockRepo({ entities: [] }),
            },
          ],
        })
      ).get(ChallengeCreatorDailyNotificationConfig);
    });

    it('should return the correct notification data', async () => {
      const challenge = ChallengeEntityFake();
      const recipient = UserEntityFake();
      const result = await config.getNotificationData({
        parent: challenge,
        recipient,
      });
      expect(result).toEqual(
        ok({
          verb: ActivityVerb.CHALLENGE_CREATED,
          activityOwnerId: recipient.id,
          challengeId: challenge.id,
        })
      );
    });

    it('should return undefined if before the challenge', async () => {
      const challenge = ChallengeEntityFake();
      challenge.startDate = add(new Date(), { days: 1 });
      const recipient = UserEntityFake();
      const resultBefore = await config.getNotificationData({
        parent: challenge,
        recipient,
      });
      expect(resultBefore.isOk()).toBe(true);
      expect(resultBefore._unsafeUnwrap()).toBe(undefined);
    });

    it('should return undefined if after the challenge', async () => {
      const challenge = ChallengeEntityFake();
      challenge.endDate = sub(new Date(), { days: 1 });
      const recipient = UserEntityFake();
      const after = await config.getNotificationData({
        parent: challenge,
        recipient,
      });
      expect(after.isOk()).toBe(true);
      expect(after._unsafeUnwrap()).toBe(undefined);
    });
  });

  describe('getNotificationString', () => {
    let config: ChallengeCreatorDailyNotificationConfig;

    beforeEach(async () => {
      config = (
        await createMockedTestingModule({
          providers: [
            ChallengeCreatorDailyNotificationConfig,
            {
              provide: getRepositoryToken(ChallengeSchema),
              useValue: createMockRepo({ entities: [] }),
            },
            {
              provide: getRepositoryToken(FeedSchema),
              useValue: createMockRepo({ entities: [] }),
            },
          ],
        })
      ).get(ChallengeCreatorDailyNotificationConfig);
    });

    it('should return generic nudge strings if during challenge', async () => {
      const challenge = ChallengeEntityFake();
      challenge.name = 'Test Challenge';
      challenge.startDate = sub(new Date(), { days: 4 });
      challenge.endDate = add(new Date(), { days: 3 });
      const result = await config.getNotificationString({
        parent: challenge,
        recipient: UserEntityFake(),
      });
      expect(result._unsafeUnwrap()).toEqual({
        title:
          `Post today’s entry for Test Challenge and motivate your ` +
          `participants 💯`,
        body: `You're making great progress, keep it up!`,
      });
    });

    it('should return five days remaining nudge', async () => {
      const challenge = ChallengeEntityFake();
      challenge.name = 'Test Challenge';
      challenge.startDate = sub(new Date(), { days: 4 });
      challenge.endDate = add(new Date(), { days: 5 });
      const result = await config.getNotificationString({
        parent: challenge,
        recipient: UserEntityFake(),
      });
      expect(result._unsafeUnwrap()).toEqual({
        title: `There's only 5 days left of Test Challenge ⏰`,
        body: `You're almost there, finish strong!`,
      });
    });

    it('should return starting today message', async () => {
      const challenge = ChallengeEntityFake();
      challenge.name = 'Test Challenge';
      challenge.startDate = new Date();
      challenge.endDate = add(new Date(), { days: 5 });
      const result = await config.getNotificationString({
        parent: challenge,
        recipient: UserEntityFake({
          localizationData: { timezoneOffset: '+00:00' },
        }),
      });
      expect(result._unsafeUnwrap()).toEqual({
        title: `Test Challenge is starting today! 🗓️`,
        body: `Tap to start posting!`,
      });
    });

    it('should return half way through message', async () => {
      const challenge = ChallengeEntityFake();
      challenge.name = 'Test Challenge';
      challenge.startDate = sub(new Date(), { days: 15 });
      challenge.endDate = add(new Date(), { days: 15 });
      const result = await config.getNotificationString({
        parent: challenge,
        recipient: UserEntityFake({
          localizationData: { timezoneOffset: '+00:00' },
        }),
      });
      expect(result._unsafeUnwrap()).toEqual({
        title: `You're halfway through Test Challenge! 🎉`,
        body: `Keep up the good work!`,
      });
    });

    it('should return a summary notification if it is the day after a challenge', async () => {
      const challenge = ChallengeEntityFake();
      challenge.name = 'Test Challenge';
      challenge.startDate = sub(new Date(), { days: 15 });
      challenge.endDate = sub(new Date(), { days: 1 });
      // @ts-expect-error
      config['feedRepository'] = createMockRepo({
        entities: [
          FeedEntityFake({
            id: getFirstFeedPageId(
              FeedEntityType.CHALLENGE_PARTICIPANTS,
              challenge.id
            ),
            count: 3,
          }),
        ],
      });
      const result = await config.getNotificationString({
        parent: challenge,
        recipient: UserEntityFake({
          localizationData: { timezoneOffset: '+00:00' },
        }),
      });
      expect(result._unsafeUnwrap()).toEqual({
        title: `3 participants completed your challenge yesterday! 🎉`,
        body: `Tap to view their posts!`,
      });
    });
  });
});
