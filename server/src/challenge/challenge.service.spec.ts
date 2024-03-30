import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  getChallengeLeaderboardFeedId,
  getChallengeParticipantsFeedId,
  toChallengeParticipantIdString,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import {
  addJoinedChallenge,
  toUserJoinedChallengeString,
} from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { PageNotFoundError } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { BadRequestException } from '@verdzie/server/exceptions/wildr.exception';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { ChallengeState } from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';

describe('ChallengeService', () => {
  let service: ChallengeService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ChallengeService],
    });
    service = module.get(ChallengeService);
  });

  describe('joinChallenge', () => {
    it('should not allow a challenge author to join their own challenge', async () => {
      const user = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: user.id });
      await expect(service.joinChallenge(challenge, user)).rejects.toThrow(
        new BadRequestException(`You can't join your own challenge`, {
          challengeId: challenge.id,
          userId: user.id,
        })
      );
    });

    it('should not allow a user to join a completed challenge', async () => {
      const user = UserEntityFake();
      const challenge = ChallengeEntityFake({
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      });
      await expect(service.joinChallenge(challenge, user)).rejects.toThrow(
        new BadRequestException(`You can't join a completed challenge`, {
          challengeId: challenge.id,
          userId: user.id,
        })
      );
    });

    it(`should not allow a user to join a challenge created by an author that blocked them`, async () => {
      const user = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: 'authorId',
      });
      service['userService'].hasBlocked = jest.fn().mockResolvedValue(true);
      await expect(service.joinChallenge(challenge, user)).rejects.toThrow(
        new BadRequestException(
          `You can't join this challenge due to restrictions set by the creator`
        )
      );
      expect(service['userService'].hasBlocked).toHaveBeenCalledWith({
        userWhoBlockedId: challenge.authorId,
        userIdToCheck: user.id,
      });
    });
  });

  describe('leaveChallenge', () => {
    it('should throw and not perform updates if it is the challenge author', async () => {
      const user = UserEntityFake();
      const challengeId = 'challengeId';
      const challenge = ChallengeEntityFake({
        id: challengeId,
        authorId: user.id,
      });
      const feedRepo = {};
      const challengeRepo = {};
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === FeedEntity) return feedRepo;
          if (entity === ChallengeEntity) return challengeRepo;
        }),
      };
      service['feedService'].removeEntry = jest
        .fn()
        .mockImplementation(async (...args) => {
          if (args[0] === getChallengeParticipantsFeedId(challengeId)) {
            return {
              entity: FeedEntityFake({
                ids: [
                  JSON.stringify({
                    id: 'user1',
                    entryCount: 2,
                    postId: 'post1',
                  }),
                  JSON.stringify({
                    id: 'user2',
                    entryCount: 3,
                    postId: 'post2',
                  }),
                ],
                count: 2,
              }),
            };
          }
        });
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async cb => {
            return await cb(manager);
          }),
        },
      };
      expect(
        service.leaveChallenge({
          challenge,
          currentUser: user,
        })
      ).rejects.toThrow(
        new BadRequestException(`You can't leave your own challenge`, {
          challengeId: challenge.id,
          userId: user.id,
        })
      );
      expect(service['feedService'].removeEntry).toHaveBeenCalledTimes(0);
      expect(
        service['updateStatsService'].jsonbSetStatsInTxT
      ).toHaveBeenCalledTimes(0);
    });

    it('should remove the entries from the leaderboard and participant feeds', async () => {
      const user = UserEntityFake();
      const challengeId = 'challengeId';
      const challenge = ChallengeEntityFake({ id: challengeId });
      addJoinedChallenge({ user, challenge });
      service['feedService'].removeEntry = jest
        .fn()
        .mockImplementation(async (...args) => {
          if (args[0] === getChallengeParticipantsFeedId(challengeId)) {
            return {
              entity: FeedEntityFake({
                ids: [
                  toChallengeParticipantIdString({
                    id: 'user1',
                    entryCount: 2,
                    postId: 'post1',
                  }),
                  toChallengeParticipantIdString({
                    id: 'user2',
                    entryCount: 3,
                    postId: 'post2',
                  }),
                ],
                count: 2,
              }),
            };
          }
        });
      const feedRepo = {};
      const challengeRepo = {};
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(user),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === FeedEntity) return feedRepo;
          if (entity === ChallengeEntity) return challengeRepo;
          if (entity === UserEntity) return userRepo;
        }),
      };
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async cb => {
            return await cb(manager);
          }),
        },
      };
      await service.leaveChallenge({
        challenge,
        currentUser: user,
      });
      expect(service['feedService'].removeEntry).toHaveBeenCalledTimes(2);
      expect(service['feedService'].removeEntry).toHaveBeenCalledWith(
        getChallengeParticipantsFeedId(challengeId),
        `"id":"${user.id}"`,
        { repo: feedRepo }
      );
      expect(service['feedService'].removeEntry).toHaveBeenCalledWith(
        getChallengeLeaderboardFeedId(challengeId),
        `"participantId":"${user.id}"`,
        { repo: feedRepo }
      );
    });

    it('should update the user as having left the challenge', async () => {
      const challengeId = 'challengeId';
      const challenge = ChallengeEntityFake({ id: challengeId });
      const user = UserEntityFake();
      addJoinedChallenge({ challenge, user });
      service['feedService'].removeEntry = jest
        .fn()
        .mockImplementation(async (...args) => {
          if (args[0] === getChallengeParticipantsFeedId(challengeId)) {
            return {
              entity: FeedEntityFake({
                ids: [
                  toChallengeParticipantIdString({
                    id: 'user1',
                    entryCount: 2,
                    postId: 'post1',
                  }),
                  toChallengeParticipantIdString({
                    id: 'user2',
                    entryCount: 3,
                    postId: 'post2',
                  }),
                ],
                count: 2,
              }),
            };
          }
        });
      const feedRepo = {};
      const challengeRepo = {};
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(user),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === FeedEntity) return feedRepo;
          if (entity === ChallengeEntity) return challengeRepo;
          if (entity === UserEntity) return userRepo;
        }),
      };
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async cb => {
            return await cb(manager);
          }),
        },
      };
      await service.leaveChallenge({
        challenge,
        currentUser: user,
      });
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(userRepo.findOne).toHaveBeenCalledWith(user.id, {
        lock: { mode: 'pessimistic_write' },
      });
      expect(userRepo.update).toHaveBeenCalledTimes(1);
      expect(userRepo.update).toHaveBeenCalledWith(user.id, {
        challengeContext: {
          joinedChallenges: [
            toUserJoinedChallengeString({
              challengeId: challenge.id,
              authorId: challenge.authorId,
              startDate: challenge.startDate,
              endDate: challenge.endDate,
            }),
          ],
        },
      });
    });

    it('should update the challenge participant count stat and participant preview', async () => {
      const user = UserEntityFake();
      const challengeId = 'challengeId';
      const challenge = ChallengeEntityFake({ id: challengeId });
      addJoinedChallenge({ user, challenge });
      const feedRepo = {};
      const challengeRepo = {};
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(user),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === FeedEntity) return feedRepo;
          if (entity === ChallengeEntity) return challengeRepo;
          if (entity === UserEntity) return userRepo;
        }),
      };
      service['feedService'].removeEntry = jest
        .fn()
        .mockImplementation(async (...args) => {
          if (args[0] === getChallengeParticipantsFeedId(challengeId)) {
            return {
              entity: FeedEntityFake({
                ids: [
                  toChallengeParticipantIdString({
                    id: 'user1',
                    entryCount: 2,
                    postId: 'post1',
                  }),
                  toChallengeParticipantIdString({
                    id: 'user2',
                    entryCount: 3,
                    postId: 'post2',
                  }),
                ],
                count: 2,
              }),
            };
          }
        });
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async cb => {
            return await cb(manager);
          }),
        },
      };
      await service.leaveChallenge({
        challenge,
        currentUser: user,
      });
      expect(
        service['updateStatsService'].jsonbSetStatsInTxT
      ).toHaveBeenCalledTimes(2);
      expect(
        service['updateStatsService'].jsonbSetStatsInTxT
      ).toHaveBeenCalledWith({
        id: challengeId,
        statsKey: 'previewParticipants',
        statsValue: 'user1#user2',
        repo: challengeRepo,
      });
      expect(
        service['updateStatsService'].jsonbSetStatsInTxT
      ).toHaveBeenCalledWith({
        id: challengeId,
        statsKey: 'participantCount',
        statsValue: 2,
        repo: challengeRepo,
      });
    });

    it('should handle page not found errors from leaderboard or joined feed', async () => {
      const user = UserEntityFake();
      const challengeId = 'challengeId';
      const challenge = ChallengeEntityFake({ id: challengeId });
      addJoinedChallenge({ challenge, user });
      const feedRepo = {};
      const challengeRepo = {};
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(user),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === FeedEntity) return feedRepo;
          if (entity === ChallengeEntity) return challengeRepo;
          if (entity === UserEntity) return userRepo;
        }),
      };
      service['feedService'].removeEntry = jest
        .fn()
        .mockImplementation(async (...args) => {
          if (args[0] === getChallengeParticipantsFeedId(challengeId)) {
            return {
              entity: FeedEntityFake({
                ids: [
                  JSON.stringify({
                    id: 'user1',
                    entryCount: 2,
                    postId: 'post1',
                  }),
                  JSON.stringify({
                    id: 'user2',
                    entryCount: 3,
                    postId: 'post2',
                  }),
                ],
                count: 2,
              }),
            };
          } else {
            throw new PageNotFoundError();
          }
        });
      service['repo'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async cb => {
            return await cb(manager);
          }),
        },
      };
      await service.leaveChallenge({
        challenge,
        currentUser: user,
      });
      expect(service['feedService'].removeEntry).toHaveBeenCalledTimes(2);
      expect(userRepo.update).toHaveBeenCalledTimes(1);
      expect(
        service['updateStatsService'].jsonbSetStatsInTxT
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe('findJoinedChallenges', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should get all joined challenges if no state is provided', async () => {
      const challenges = Array.from({ length: 3 }).map((v, i) => {
        if (i === 0) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i === 1) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        } else {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
      });
      const currentUser = UserEntityFake();
      challenges.forEach(challenge =>
        addJoinedChallenge({ user: currentUser, challenge: challenge })
      );
      service['repo'].findByIds = jest.fn().mockImplementation(({ ids }) => {
        const result = [];
        for (const id of ids) {
          const challenge = challenges.find(challenge => challenge.id === id);
          if (challenge) result.push(challenge);
        }
        return Promise.resolve(result);
      });
      const result = await service.findJoinedChallenges({
        currentUser,
      });
      expect(result).toEqual(challenges);
    });

    it('should get starting after current date and ending in the future if state is ACTIVE', async () => {
      const challengeState = ChallengeState.ACTIVE;
      const challenges = Array.from({ length: 3 }).map((v, i) => {
        if (i === 0) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i === 1) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        } else {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
      });
      const currentUser = UserEntityFake();
      challenges.forEach(challenge =>
        addJoinedChallenge({ user: currentUser, challenge })
      );
      service['repo'].findByIds = jest.fn().mockImplementation(({ ids }) => {
        const result = [];
        for (const id of ids) {
          const challenge = challenges.find(challenge => challenge.id === id);
          if (challenge) result.push(challenge);
        }
        return Promise.resolve(result);
      });
      const result = await service.findJoinedChallenges({
        currentUser,
        challengeState,
      });
      expect(result).toEqual([challenges[1]]);
    });

    it('should get challenges that have ended if state is ENDED', async () => {
      const challengeState = ChallengeState.ENDED;
      const challenges = Array.from({ length: 3 }).map((v, i) => {
        if (i === 0) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i === 1) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        } else {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
      });
      const currentUser = UserEntityFake();
      challenges.forEach(challenge =>
        addJoinedChallenge({ user: currentUser, challenge })
      );
      service['repo'].findByIds = jest.fn().mockImplementation(({ ids }) => {
        const result = [];
        for (const id of ids) {
          const challenge = challenges.find(challenge => challenge.id === id);
          if (challenge) result.push(challenge);
        }
        return Promise.resolve(result);
      });
      const result = await service.findJoinedChallenges({
        currentUser,
        challengeState,
      });
      expect(result).toEqual([challenges[0]]);
    });

    it('should get challenges that have not started if state is CREATED', async () => {
      const challengeState = ChallengeState.CREATED;
      const challenges = Array.from({ length: 3 }).map((v, i) => {
        if (i === 0) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i === 1) {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        } else {
          return ChallengeEntityFake({
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
      });
      const currentUser = UserEntityFake();
      challenges.forEach(challenge =>
        addJoinedChallenge({ user: currentUser, challenge })
      );
      service['repo'].findByIds = jest.fn().mockImplementation(({ ids }) => {
        const result = [];
        for (const id of ids) {
          const challenge = challenges.find(challenge => challenge.id === id);
          if (challenge) result.push(challenge);
        }
        return Promise.resolve(result);
      });
      const result = await service.findJoinedChallenges({
        currentUser,
        challengeState,
      });
      expect(result).toEqual([challenges[2]]);
    });
  });
});
