import '../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import '../../env/admin-local-config';

import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import config from '@verdzie/server/typeorm/typeormconfig-wildr';
import { Like, createConnection } from 'typeorm';
import chalk from 'chalk';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { last } from 'lodash';
import { FEED_ID_SEPARATOR } from '@verdzie/server/feed/feed.service';
import {
  fromChallengeParticipantPostEntryStr,
  getUserPostEntriesOnChallengeFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { toUserJoinedChallengeString } from '@verdzie/server/challenge/userJoinedChallenges.helper';

export interface JoinedChallengeEntry {
  startDate: Date;
  endDate?: Date;
  challengeId: string;
}

export const fromJoinedChallengeEntryStr = (
  entryStr: string
): JoinedChallengeEntry | undefined => {
  try {
    const entry = JSON.parse(entryStr);
    entry.startDate = new Date(entry.startDate);
    entry.endDate = entry.endDate ? new Date(entry.endDate) : undefined;
    return entry;
  } catch (e) {
    return;
  }
};

async function main() {
  let conn;
  try {
    console.log(chalk.blue('\nMigrating joined challenge feeds...'));
    conn = await createConnection(config as PostgresConnectionOptions);
    const feedRepo = conn.getRepository(FeedEntity);
    const joinedChallengesFeeds = await feedRepo.find({
      where: {
        id: Like(`${FeedEntityType.USER_JOINED_CHALLENGES}%`),
      },
    });
    console.log(
      chalk.blue(
        `\nFound ${joinedChallengesFeeds.length} joined challenge feeds.`
      )
    );
    for (const feed of joinedChallengesFeeds) {
      await conn.manager.transaction(async manager => {
        const userId = feed.id.split(FEED_ID_SEPARATOR)[1].split('~')[0];
        const joinedChallengeIds = feed.page.ids
          .map(id => {
            return fromJoinedChallengeEntryStr(id)?.challengeId;
          })
          .filter(id => !!id);
        const user = await manager
          .getRepository(UserEntity)
          .findOne(userId, { lock: { mode: 'pessimistic_write' } });
        if (!user) {
          console.log(chalk.red(`\nUser not found for feed id ${feed.id}`));
          return;
        }
        const challenges = await manager
          .getRepository(ChallengeEntity)
          .findByIds(joinedChallengeIds);
        console.log(
          chalk.blue(
            `\nFound ${challenges.length} challenge(s) for user id ${userId}`
          )
        );
        const userJoinedChallengesFeedIds: string[] = [];
        for (const challenge of challenges) {
          const userEntriesOnChallengeFeed = await feedRepo.findOne({
            where: {
              id: getUserPostEntriesOnChallengeFeedId(challenge.id, userId),
            },
          });
          if (!userEntriesOnChallengeFeed) {
            console.log(
              chalk.yellow(
                `\nUser entries on challenge feed not found for user id ${userId} and challenge id ${challenge.id}`
              )
            );
          }
          console.log(
            chalk.blue(
              `\nFound user entries on challenge feed for user id ${userId}`
            )
          );
          const mostRecentEntry =
            userEntriesOnChallengeFeed &&
            fromChallengeParticipantPostEntryStr(
              last(userEntriesOnChallengeFeed.page.ids) || ''
            );
          userJoinedChallengesFeedIds.push(
            toUserJoinedChallengeString({
              challengeId: challenge.id,
              authorId: challenge.authorId,
              startDate: challenge.startDate,
              endDate: challenge.endDate,
              ...(mostRecentEntry && { latestEntryTime: mostRecentEntry.date }),
              joinedAt: new Date(),
            })
          );
        }
        if (userJoinedChallengesFeedIds.length !== 0) {
          console.log(
            chalk.blue(
              `\nAdding ${userJoinedChallengesFeedIds.length} joined challenge feed ids to user id ${userId}`,
              userJoinedChallengesFeedIds
            )
          );
          await manager.getRepository(UserEntity).update(userId, {
            challengeContext: { joinedChallenges: userJoinedChallengesFeedIds },
          });
        }
        return;
      });
    }
  } catch (err) {
    console.log(chalk.red(err));
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

main();
