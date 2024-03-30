import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import {
  getChallengeNotificationData,
  getStartAndEndFromChallenge,
  isDaysAway,
  isHalfwayBetween,
} from '@verdzie/server/notification-scheduler/notification-config/configs/notification-config.common';
import { createMockRepo } from '@verdzie/server/testing/base.module';
import { add, sub } from 'date-fns';

describe('notification-config.common', () => {
  describe('getStartAndEndFromChallenge', () => {
    it('should return an error if the parent challenge is not found', async () => {
      const challengeId = 'challengeId';
      const result = await getStartAndEndFromChallenge({
        challengeId,
        challengeRepo: createMockRepo({ entities: [] }) as any,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
    });

    it('should return the start date as one day before the challenge starts', async () => {
      const challengeId = 'challengeId';
      const result = await getStartAndEndFromChallenge({
        challengeId,
        challengeRepo: createMockRepo({
          entities: [
            ChallengeEntityFake({
              id: challengeId,
              startDate: new Date(2020, 0, 2),
            }),
          ],
        }) as any,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        start: new Date(2020, 0, 1),
      });
    });

    it('should return the end date as one day after the challenge ends', async () => {
      const challengeId = 'challengeId';
      const result = await getStartAndEndFromChallenge({
        challengeId,
        challengeRepo: createMockRepo({
          entities: [
            ChallengeEntityFake({
              id: challengeId,
              startDate: new Date(2020, 0, 2),
              endDate: new Date(2020, 0, 4),
            }),
          ],
        }) as any,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        start: new Date(2020, 0, 1),
        end: new Date(2020, 0, 5),
      });
    });
  });

  describe('getChallengeNotificationData', () => {
    it('should return undefined if the challenge has not started', async () => {
      const parent = ChallengeEntityFake({
        startDate: add(new Date(), { days: 1 }),
      });
      const recipientId = 'recipientId';
      const result = await getChallengeNotificationData({
        parent,
        recipientId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return undefined if the challenge has ended', async () => {
      const parent = ChallengeEntityFake({
        startDate: add(new Date(), { days: -4 }),
        endDate: add(new Date(), { days: -2 }),
      });
      const recipientId = 'recipientId';
      const result = await getChallengeNotificationData({
        parent,
        recipientId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return the notification data if the challenge is active', async () => {
      const parent = ChallengeEntityFake({
        startDate: add(new Date(), { days: -4 }),
      });
      const recipientId = 'recipientId';
      const result = await getChallengeNotificationData({
        parent,
        recipientId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        verb: ActivityVerb.CHALLENGE_CREATED,
        activityOwnerId: recipientId,
        challengeId: parent.id,
      });
    });
  });

  describe('isDaysAway', () => {
    it('should return true if the date is the specified number of days away', () => {
      const dayCount = 3;
      const date = add(new Date(), { days: dayCount });
      const result = isDaysAway({ dayCount, date });
      expect(result).toBe(true);
    });

    it('should return false if the date is not the specified number of days away', () => {
      const dayCount = 3;
      const date = add(new Date(), { days: dayCount + 1 });
      const result = isDaysAway({ dayCount, date });
      expect(result).toBe(false);
    });
  });

  describe('isHalfwayBetween', () => {
    it('should return true if the date is halfway between the start and end dates', () => {
      const start = sub(new Date(), { days: 2 });
      const end = add(new Date(), { days: 2 });
      const result = isHalfwayBetween({ start, end });
      expect(result).toBe(true);
    });

    it('should return false if the date is not halfway between the start and end dates', () => {
      const start = new Date(2020, 0, 1);
      const end = new Date(2020, 0, 4);
      const result = isHalfwayBetween({ start, end });
      expect(result).toBe(false);
    });
  });
});
