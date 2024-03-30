import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
} from '@verdzie/server/exceptions/wildr.exception';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { format, getTimezoneOffset } from 'date-fns-tz';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

const DATE_FORMAT = 'yyyy-MM-dd';

export type JoinedChallengeEntry = {
  challengeId: string;
  authorId: string;
  startDate: Date;
  endDate?: Date;
  latestEntryTime?: Date;
  joinedAt?: Date;
};

/**
 * cid: Challenge ID
 * aid: Author ID
 * sd: Start Date
 * ed: End Date
 * ja: Joined At; is empty if the user has left the challenge
 * let: Last entry time
 */
export function toUserJoinedChallengeString(
  entry: JoinedChallengeEntry
): string {
  // Ensures consistent order of properties in entry string
  return JSON.stringify({
    cid: entry.challengeId,
    aid: entry.authorId,
    sd: +entry.startDate,
    // Serializing as number to save space and improve parsing performance
    ...(entry.endDate && { ed: +entry.endDate }),
    ...(entry.joinedAt && { ja: +entry.joinedAt }),
    ...(entry.latestEntryTime && { let: +entry.latestEntryTime }),
  });
}

export function fromUserJoinedChallengeString(
  entryStr: string
): JoinedChallengeEntry | undefined {
  try {
    const entry = JSON.parse(entryStr);
    return {
      challengeId: entry.cid,
      authorId: entry.aid,
      startDate: new Date(entry.sd),
      ...(entry.ed && { endDate: new Date(entry.ed) }),
      ...(entry.ja && { joinedAt: new Date(entry.ja) }),
      ...(entry.let && { latestEntryTime: new Date(entry.let) }),
    };
  } catch (e) {
    //console.log('Error parsing joined challenge entry string', e, entryStr);
    return;
  }
}

export function addJoinedChallenge({
  challenge,
  user,
}: {
  challenge: ChallengeEntity;
  user: UserEntity;
}): Result<undefined, AlreadyJoinedChallengeException> {
  if (!user.challengeContext) {
    user.challengeContext = {
      joinedChallenges: [],
    };
  }
  if (!user.challengeContext.joinedChallenges) {
    user.challengeContext.joinedChallenges = [];
  }
  const existingChallengeIndex =
    user.challengeContext.joinedChallenges.findIndex((str: string) => {
      return str.includes(`"cid":"${challenge.id}"`);
    });
  if (existingChallengeIndex === -1) {
    user.challengeContext.joinedChallenges.push(
      toUserJoinedChallengeString({
        authorId: challenge.authorId,
        challengeId: challenge.id,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        joinedAt: new Date(),
      })
    );
    return ok(undefined);
  }
  const existingChallengeEntry = fromUserJoinedChallengeString(
    user.challengeContext.joinedChallenges[existingChallengeIndex]
  );
  if (!existingChallengeEntry) {
    user.challengeContext.joinedChallenges[existingChallengeIndex] =
      toUserJoinedChallengeString({
        authorId: challenge.authorId,
        challengeId: challenge.id,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        joinedAt: new Date(),
      });
    return ok(undefined);
  }
  if (existingChallengeEntry?.joinedAt) {
    return err(new AlreadyJoinedChallengeException({}));
  }
  user.challengeContext.joinedChallenges[existingChallengeIndex] =
    toUserJoinedChallengeString({
      ...existingChallengeEntry,
      joinedAt: new Date(),
    });
  return ok(undefined);
}

export function removeJoinedChallenge({
  user,
  challengeId,
}: {
  user: UserEntity;
  challengeId: string;
}): Result<undefined, HasNotJoinedChallengeException> {
  if (!user.challengeContext?.joinedChallenges) {
    return err(new HasNotJoinedChallengeException({}));
  }
  const existingChallengeIndex =
    user.challengeContext.joinedChallenges.findIndex(str => {
      return str.includes(`"cid":"${challengeId}"`);
    });
  if (existingChallengeIndex === -1) {
    return err(new HasNotJoinedChallengeException({}));
  }
  const existingChallengeEntry = fromUserJoinedChallengeString(
    user.challengeContext.joinedChallenges[existingChallengeIndex]
  );
  if (!existingChallengeEntry) {
    return err(new HasNotJoinedChallengeException({}));
  }
  if (!existingChallengeEntry?.joinedAt) {
    return err(new HasNotJoinedChallengeException({}));
  }
  user.challengeContext.joinedChallenges[existingChallengeIndex] =
    toUserJoinedChallengeString({
      ...existingChallengeEntry,
      joinedAt: undefined,
    });
  return ok(undefined);
}

export function updateStartOrEndDateInJoinedChallengeEntry({
  user,
  challengeId,
  startDate,
  endDate,
  logger,
}: {
  user: UserEntity;
  challengeId: string;
  startDate?: Date;
  endDate?: Date;
  logger?: Logger;
}): UserEntity | undefined {
  logger?.info('DATA', { startDate, endDate, challengeId });
  const challengeContext = user.challengeContext;
  if (!challengeContext || !challengeContext.joinedChallenges) {
    logger?.info('challenge context or joinedChallenges in that is null');
    return;
  }
  const existingChallengeIndex = challengeContext.joinedChallenges.findIndex(
    str => {
      return str.includes(`"cid":"${challengeId}"`);
    }
  );
  if (existingChallengeIndex === -1) {
    logger?.info('existingChallengeIndex = -1');
    return;
  }
  const existingChallengeEntry = fromUserJoinedChallengeString(
    challengeContext.joinedChallenges[existingChallengeIndex]
  );
  if (!existingChallengeEntry) {
    logger?.info('Not found');
    return;
  }
  challengeContext.joinedChallenges[existingChallengeIndex] =
    toUserJoinedChallengeString({
      ...existingChallengeEntry,
      ...(startDate && { startDate: startDate }),
      ...(endDate && { endDate: endDate }),
    });
  user.challengeContext = challengeContext;
  return user;
}

export function isChallengeParticipant({
  user,
  challengeId,
}: {
  user: UserEntity;
  challengeId: string;
}): boolean {
  if (!user.challengeContext?.joinedChallenges) {
    return false;
  }
  const joinedChallenge = user.challengeContext.joinedChallenges.find(str => {
    return str.includes(`"cid":"${challengeId}"`);
  });
  if (!joinedChallenge) {
    return false;
  }
  const existingChallengeEntry = fromUserJoinedChallengeString(joinedChallenge);
  return !!existingChallengeEntry?.joinedAt;
}

export function hadPreviouslyJoinedChallenge({
  user,
  challengeId,
}: {
  user: UserEntity;
  challengeId: string;
}): boolean {
  if (!user.challengeContext?.joinedChallenges) {
    return false;
  }
  const existingChallenge = user.challengeContext.joinedChallenges.find(
    (str: string) => {
      return str.includes(`"cid":"${challengeId}"`);
    }
  );
  return !!existingChallenge;
}

export function hasChallengeEntryToday({
  challengeId,
  timezoneOffset,
  user,
}: {
  challengeId: string;
  timezoneOffset: string;
  user: UserEntity;
}): boolean {
  if (!user.challengeContext?.joinedChallenges) {
    return false;
  }
  const joinedChallengeString = user.challengeContext.joinedChallenges.find(
    (str: string) => {
      return str.includes(`"cid":"${challengeId}"`);
    }
  );
  if (!joinedChallengeString) {
    return false;
  }
  const joinedChallengeEntry = fromUserJoinedChallengeString(
    joinedChallengeString
  );
  if (!joinedChallengeEntry || !joinedChallengeEntry?.latestEntryTime) {
    return false;
  }
  const timezoneOffsetMs = getTimezoneOffset(timezoneOffset);
  const entryDateFormatted = format(
    new Date(+joinedChallengeEntry.latestEntryTime + timezoneOffsetMs),
    DATE_FORMAT
  );
  const currentDateFormatted = format(
    new Date(Date.now() + timezoneOffsetMs),
    DATE_FORMAT
  );
  return entryDateFormatted === currentDateFormatted;
}

export function getChallengeFromJoinedChallenges({
  challengeId,
  user,
}: {
  challengeId: string;
  user: UserEntity;
}): Result<JoinedChallengeEntry, HasNotJoinedChallengeException> {
  if (!user.challengeContext?.joinedChallenges) {
    return err(new HasNotJoinedChallengeException({}));
  }
  const joinedChallengeString = user.challengeContext.joinedChallenges.find(
    (str: string) => {
      return str.includes(`"cid":"${challengeId}"`);
    }
  );
  if (!joinedChallengeString) {
    return err(new HasNotJoinedChallengeException({}));
  }
  const joinedChallengeEntry = fromUserJoinedChallengeString(
    joinedChallengeString
  );
  if (!joinedChallengeEntry) {
    return err(new HasNotJoinedChallengeException({}));
  }
  return ok(joinedChallengeEntry);
}

export function updateJoinedChallengeEntryPost({
  user,
  challengeId,
  post,
}: {
  user: UserEntity;
  challengeId: string;
  post: PostEntity;
}): Result<undefined, HasNotJoinedChallengeException> {
  if (!user.challengeContext?.joinedChallenges) {
    return err(new HasNotJoinedChallengeException({}));
  }
  const existingChallengeIndex =
    user.challengeContext.joinedChallenges.findIndex(str => {
      return str.includes(`"cid":"${challengeId}"`);
    });
  if (existingChallengeIndex === -1) {
    return err(new HasNotJoinedChallengeException({}));
  }
  const existingChallengeEntry = fromUserJoinedChallengeString(
    user.challengeContext.joinedChallenges[existingChallengeIndex]
  );
  if (!existingChallengeEntry) {
    return err(new HasNotJoinedChallengeException({}));
  }
  user.challengeContext.joinedChallenges[existingChallengeIndex] =
    toUserJoinedChallengeString({
      challengeId,
      authorId: existingChallengeEntry.authorId,
      startDate: existingChallengeEntry.startDate,
      endDate: existingChallengeEntry.endDate,
      latestEntryTime: post.createdAt,
      joinedAt: existingChallengeEntry.joinedAt,
    });
  return ok(undefined);
}

export class HasNotJoinedChallengeException extends BadRequestException {
  constructor({
    message = 'You cannot leave a challenge you have not joined',
    debugData,
  }: {
    message?: string;
    debugData?: Partial<DebugData<BadRequestExceptionCodes>>;
  }) {
    super(message, debugData);
  }
}

export class AlreadyJoinedChallengeException extends BadRequestException {
  constructor({
    message = 'You have already joined this challenge',
    debugData = {},
  }: {
    message?: string;
    debugData?: Partial<DebugData<BadRequestExceptionCodes>>;
  }) {
    super(message, debugData);
  }
}
