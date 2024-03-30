import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import {
  add,
  differenceInDays,
  isAfter,
  isBefore,
  isSameDay,
  sub,
} from 'date-fns';
import { DateTime } from 'luxon';
import { err, ok } from 'neverthrow';
import { Repository } from 'typeorm';

export const getStartAndEndFromChallenge = async ({
  challengeId,
  challengeRepo,
}: {
  challengeId: string;
  challengeRepo: Repository<ChallengeEntity>;
}) => {
  const parentChallenge = await challengeRepo.findOne(challengeId);
  if (!parentChallenge) {
    return err(
      new InternalServerErrorException('Parent challenge not found', {
        challengeId,
      })
    );
  }
  return ok({
    start: sub(parentChallenge.startDate, { days: 1 }),
    // Add one day to the end date for the summary notifications
    end: parentChallenge.endDate
      ? add(parentChallenge.endDate, { days: 1 })
      : undefined,
  });
};

export const getChallengeNotificationData = async ({
  parent,
  recipientId,
}: {
  parent: ChallengeEntity;
  recipientId: string;
}) => {
  if (
    isBefore(new Date(), parent.startDate) ||
    (parent.endDate && isAfter(new Date(), parent.endDate))
  ) {
    return ok(undefined);
  }
  return ok({
    // Use challenge created as it will route to the challenge page with old
    // versions of the app
    verb: ActivityVerb.CHALLENGE_CREATED,
    activityOwnerId: recipientId,
    challengeId: parent.id,
  });
};

export const isDaysAway = ({
  dayCount,
  date,
}: {
  dayCount: number;
  date: Date;
}) => {
  const now = new Date();
  const daysTill = sub(date, { days: dayCount });
  return isSameDay(now, daysTill);
};

export const isHalfwayBetween = ({
  start,
  end,
}: {
  start: Date;
  end: Date;
}) => {
  const now = new Date();
  const daysDifference = differenceInDays(end, start);
  const halfDaysDifference = Math.floor(daysDifference / 2);
  const halfwayDate = add(start, { days: halfDaysDifference });
  return isSameDay(now, halfwayDate);
};

export const isSameZonedDate = (firstDate: DateTime, secondDate: DateTime) => {
  return (
    firstDate.day === secondDate.day &&
    firstDate.month === secondDate.month &&
    firstDate.year === secondDate.year
  );
};

export const SHARDING_FACTOR = 1050;
