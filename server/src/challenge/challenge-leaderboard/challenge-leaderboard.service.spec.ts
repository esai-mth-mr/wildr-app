import {
  getChallengeLeaderboardFeedId,
  getUserPostEntriesOnChallengeFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { toChallengeLeaderboardEdge } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.common';
import {
  ChallengeLeaderboardOperation,
  ChallengeLeaderboardService,
} from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.service';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { getFirstPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import {
  FeedEntity,
  FeedEntityType,
  FeedPage,
} from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

describe('ChallengeLeaderboardService', () => {
  let service: ChallengeLeaderboardService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ChallengeLeaderboardService],
    });
    service = module.get(ChallengeLeaderboardService);
  });

  describe('updateChallengeLeaderboard', () => {
    it('should create a new feed with author if one does not exist', async () => {
      const participantId = 'participantId';
      const challenge = ChallengeEntityFake({ authorId: participantId });
      const latestEntryId = 'latestEntryId';
      const feeds = [
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 1,
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(feed => feed.id === id);
          }),
          insert: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(manager.getRepository).toHaveBeenCalledWith(FeedEntity);
      expect(manager.getRepository(FeedEntity).findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        { lock: { mode: 'pessimistic_write' } }
      );
      const insertCall = manager.getRepository(FeedEntity).insert.mock.calls[0];
      expect(insertCall[0].id).toEqual(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(insertCall[0].page.ids).toHaveLength(1);
      expect(JSON.parse(insertCall[0].page.ids[0])).toEqual({
        participantId,
        entryCount: 1,
        latestEntryId,
      });
    });

    it('should used passed in entryCount for author if available', async () => {
      const participantId = 'participantId';
      const challenge = ChallengeEntityFake({ authorId: participantId });
      const latestEntryId = 'latestEntryId';
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(undefined),
          insert: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
        entryCount: 1,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(manager.getRepository).toHaveBeenCalledWith(FeedEntity);
      expect(manager.getRepository(FeedEntity).findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        { lock: { mode: 'pessimistic_write' } }
      );
      const insertCall = manager.getRepository(FeedEntity).insert.mock.calls[0];
      expect(insertCall[0].id).toEqual(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(insertCall[0].page.ids).toHaveLength(1);
      expect(JSON.parse(insertCall[0].page.ids[0])).toEqual({
        participantId,
        entryCount: 1,
        latestEntryId,
      });
    });

    it('should add the author as first entry if the feed exists but is empty', async () => {
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId';
      const challenge = ChallengeEntityFake({ authorId: participantId });
      const feeds = [
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 2,
        }),
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          count: 0,
          ids: [],
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest
            .fn()
            .mockImplementation(id => feeds.find(feed => feed.id === id)),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };

      // @ts-ignore
      service['challengeRepository'] = {
        findOne: jest.fn().mockReturnValue(challenge),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge.id,
        participantId,
        latestEntryId,
      });
      expect(service['challengeRepository'].findOne).toHaveBeenCalledWith({
        id: challenge.id,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(manager.getRepository).toHaveBeenCalledWith(FeedEntity);
      expect(manager.getRepository(FeedEntity).findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        { lock: { mode: 'pessimistic_write' } }
      );
      const updateCall = manager.getRepository(FeedEntity).update.mock.calls[0];
      expect(updateCall[0]).toEqual(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updateCall[1].page.ids).toHaveLength(1);
      expect(JSON.parse(updateCall[1].page.ids[0])).toEqual({
        participantId,
        entryCount: 2,
        latestEntryId,
      });
    });

    it('should remove the authors entry and push entry if authors entry is present', async () => {
      const participantId = 'participantId';
      const entryCount = 2;
      const latestEntryId = 'latestEntryId2';
      const leaderboardFeed = FeedEntityFake({
        page: {
          ids: [
            toChallengeLeaderboardEdge({
              participantId: 'participantId1',
              entryCount: 1,
              latestEntryId: 'latestEntryId3',
            }),
            toChallengeLeaderboardEdge({
              participantId,
              entryCount: 1,
              latestEntryId: 'latestEntryId1',
            }),
          ],
        } as FeedPage,
      });
      const challenge = ChallengeEntityFake({ authorId: participantId });
      service['challengeRepository'].findOne = jest
        .fn()
        .mockReturnValue(challenge);
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockReturnValue(leaderboardFeed),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge.id,
        participantId,
        latestEntryId,
        entryCount,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.UPDATE,
      });
      const updateCall = manager.getRepository(FeedEntity).update.mock.calls[0];
      expect(updateCall[0]).toEqual(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updateCall[1].page.ids).toHaveLength(2);
      expect(JSON.parse(updateCall[1].page.ids[1])).toEqual({
        participantId,
        entryCount,
        latestEntryId,
      });
    });

    it('should add the author to the last position', async () => {
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId2';
      const feed = FeedEntityFake();
      feed.page.ids = [
        toChallengeLeaderboardEdge({
          participantId: 'participantId1',
          entryCount: 1,
          latestEntryId: 'latestEntryId3',
        }),
      ];
      const challenge = ChallengeEntityFake({ authorId: participantId });
      service['challengeRepository'].findOne = jest
        .fn()
        .mockReturnValue(challenge);
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockReturnValue(feed),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge.id,
        participantId,
        latestEntryId,
        entryCount: 1,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      const updateCall = manager.getRepository(FeedEntity).update.mock.calls[0];
      expect(updateCall[0]).toEqual(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updateCall[1].page.ids).toHaveLength(2);
      expect(JSON.parse(updateCall[1].page.ids[1])).toEqual({
        participantId,
        entryCount: 1,
        latestEntryId,
      });
    });

    it('should remove the author if the entry count is 0', async () => {
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId2';
      const challenge = ChallengeEntityFake({ authorId: participantId });
      const feeds = [
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          page: {
            ids: [
              toChallengeLeaderboardEdge({
                participantId: 'participantId1',
                entryCount: 1,
                latestEntryId: 'latestEntryId3',
              }),
              toChallengeLeaderboardEdge({
                participantId: 'participantId',
                entryCount: 1,
                latestEntryId: 'latestEntryId3',
              }),
            ],
          } as FeedPage,
        }),
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 0,
        }),
      ];
      service['challengeRepository'].findOne = jest
        .fn()
        .mockReturnValue(challenge);
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(feed => feed.id === id);
          }),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge.id,
        participantId,
        latestEntryId,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.DELETE,
      });
      const updateCall = manager.getRepository(FeedEntity).update.mock.calls[0];
      expect(updateCall[0]).toEqual(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updateCall[1].page.ids).toHaveLength(1);
      expect(JSON.parse(updateCall[1].page.ids[0])).toEqual({
        participantId: 'participantId1',
        entryCount: 1,
        latestEntryId: 'latestEntryId3',
      });
    });

    it('should create a new feed with the participant if one does not exist', async () => {
      const challenge = ChallengeEntityFake();
      const participantId = 'participantId';
      const latestEntryId = 'latestId5';
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockReturnValue(undefined),
          insert: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
        entryCount: 1,
      });
      service['challengeRepository'].findOne = jest
        .fn()
        .mockReturnValue(challenge);
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(service['challengeRepository'].findOne).not.toHaveBeenCalled();
      expect(manager.getRepository().findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        {
          lock: { mode: 'pessimistic_write' },
        }
      );
      const [insertedFeed] = manager.getRepository().insert.mock.calls[0];
      expect(insertedFeed.page.ids[0]).toEqual(
        JSON.stringify({
          participantId,
          entryCount: 1,
          latestEntryId,
        })
      );
      expect(insertedFeed.count).toBe(1);
      expect(insertedFeed.id).toBe(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
    });

    it('should add the participant to an existing feed', async () => {
      const challenge = ChallengeEntityFake();
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId5';
      const feeds = [
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          page: {
            ids: [
              toChallengeLeaderboardEdge({
                participantId: 'participantId2',
                entryCount: 1,
                latestEntryId: 'latestEntryId3',
              }),
              toChallengeLeaderboardEdge({
                participantId: challenge.authorId,
                entryCount: 4,
                latestEntryId: 'latestEntryId1',
              }),
            ],
          } as any,
        }),
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 2,
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(f => f.id === id);
          }),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(service['challengeRepository'].findOne).not.toHaveBeenCalled();
      expect(manager.getRepository().findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        {
          lock: { mode: 'pessimistic_write' },
        }
      );
      const [updateId, updatedFeed] =
        manager.getRepository().update.mock.calls[0];
      expect(updateId).toBe(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updatedFeed.page.ids[1]).toEqual(
        JSON.stringify({
          participantId,
          entryCount: 2,
          latestEntryId,
        })
      );
      expect(updatedFeed.count).toBe(3);
    });

    it('should leave challenge author at the top of the leaderboard', async () => {
      const challenge = ChallengeEntityFake();
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId5';
      const feeds = [
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          page: {
            ids: [
              toChallengeLeaderboardEdge({
                participantId: 'participantId2',
                entryCount: 1,
                latestEntryId: 'latestEntryId3',
              }),
              toChallengeLeaderboardEdge({
                participantId: challenge.authorId,
                entryCount: 1,
                latestEntryId: 'latestEntryId1',
              }),
            ],
          } as any,
        }),
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 5,
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(f => f.id === id);
          }),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(manager.getRepository().findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        {
          lock: { mode: 'pessimistic_write' },
        }
      );
      const [updateId, updatedFeed] =
        manager.getRepository().update.mock.calls[0];
      expect(updateId).toBe(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updatedFeed.page.ids[1]).toEqual(
        JSON.stringify({
          participantId,
          entryCount: 5,
          latestEntryId,
        })
      );
      expect(updatedFeed.page.ids[2]).toEqual(
        JSON.stringify({
          participantId: challenge.authorId,
          entryCount: 1,
          latestEntryId: 'latestEntryId1',
        })
      );
      expect(updatedFeed.count).toBe(3);
    });

    it('should add participants to an empty list', async () => {
      const challenge = ChallengeEntityFake();
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId5';
      const feeds = [
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          page: {
            ids: [],
          } as any,
        }),
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 5,
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(f => f.id === id);
          }),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(service['challengeRepository'].findOne).not.toHaveBeenCalled();
      expect(manager.getRepository().findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        {
          lock: { mode: 'pessimistic_write' },
        }
      );
      const [updateId, updatedFeed] =
        manager.getRepository().update.mock.calls[0];
      expect(updateId).toBe(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updatedFeed.page.ids[0]).toEqual(
        JSON.stringify({
          participantId,
          entryCount: 5,
          latestEntryId,
        })
      );
      expect(updatedFeed.count).toBe(1);
    });

    it('should use passed in entryCount for participant if provided', async () => {
      const challenge = ChallengeEntityFake();
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId5';
      const feeds = [
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          page: {
            ids: [],
          } as any,
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(f => f.id === id);
          }),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
        entryCount: 1,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      });
      expect(service['challengeRepository'].findOne).not.toHaveBeenCalled();
      expect(manager.getRepository().findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        {
          lock: { mode: 'pessimistic_write' },
        }
      );
      const [updateId, updatedFeed] =
        manager.getRepository().update.mock.calls[0];
      expect(updateId).toBe(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updatedFeed.page.ids[0]).toEqual(
        JSON.stringify({
          participantId,
          entryCount: 1,
          latestEntryId,
        })
      );
      expect(updatedFeed.count).toBe(1);
    });

    it('should replace participants old entry with new entry incrementing entryCount', async () => {
      const challenge = ChallengeEntityFake();
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId5';
      const feeds = [
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          page: {
            ids: [
              toChallengeLeaderboardEdge({
                participantId: 'participantId2',
                entryCount: 1,
                latestEntryId: 'latestEntryId3',
              }),
              toChallengeLeaderboardEdge({
                participantId,
                entryCount: 3,
                latestEntryId: 'latestEntryId37',
              }),
              toChallengeLeaderboardEdge({
                participantId: 'participantId555',
                entryCount: 5,
                latestEntryId: 'latestEntryId37',
              }),
              toChallengeLeaderboardEdge({
                participantId: challenge.authorId,
                entryCount: 1,
                latestEntryId: 'latestEntryId1',
              }),
            ],
          } as any,
        }),
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 4,
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(f => f.id === id);
          }),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.UPDATE,
      });
      expect(service['challengeRepository'].findOne).not.toHaveBeenCalled();
      expect(manager.getRepository().findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        {
          lock: { mode: 'pessimistic_write' },
        }
      );
      const [updateId, updatedFeed] =
        manager.getRepository().update.mock.calls[0];
      expect(updateId).toBe(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      expect(updatedFeed.count).toBe(4);
      expect(updatedFeed.page.ids[1]).toEqual(
        JSON.stringify({
          participantId,
          entryCount: 4,
          latestEntryId,
        })
      );
    });

    it('should remove the participants entry if entryCount is 0', async () => {
      const challenge = ChallengeEntityFake();
      const participantId = 'participantId';
      const latestEntryId = 'latestEntryId5';
      const feeds = [
        FeedEntityFake({
          id: getChallengeLeaderboardFeedId(challenge.id),
          page: {
            ids: [
              toChallengeLeaderboardEdge({
                participantId: 'participantId2',
                entryCount: 1,
                latestEntryId: 'latestEntryId3',
              }),
              toChallengeLeaderboardEdge({
                participantId,
                entryCount: 1,
                latestEntryId: 'latestEntryId37',
              }),
              toChallengeLeaderboardEdge({
                participantId: 'participantId555',
                entryCount: 5,
                latestEntryId: 'latestEntryId37',
              }),
            ],
          } as any,
        }),
        FeedEntityFake({
          id: getUserPostEntriesOnChallengeFeedId(challenge.id, participantId),
          count: 0,
        }),
      ];
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockImplementation(id => {
            return feeds.find(f => f.id === id);
          }),
          update: jest.fn().mockReturnValue({ identifiers: [] }),
        }),
      };
      // @ts-ignore
      service['connection']['manager'] = {
        transaction: jest.fn().mockImplementation(async fn => {
          return fn(manager);
        }),
      } as any;
      const result = await service.updateChallengeLeaderboard({
        challengeIdOrChallenge: challenge,
        participantId,
        latestEntryId,
      });
      expect(result).toEqual({
        operationPerformed: ChallengeLeaderboardOperation.DELETE,
      });
      expect(service['challengeRepository'].findOne).not.toHaveBeenCalled();
      expect(manager.getRepository().findOne).toHaveBeenCalledWith(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        ),
        {
          lock: { mode: 'pessimistic_write' },
        }
      );
      const [updateId, updatedFeed] =
        manager.getRepository().update.mock.calls[0];
      expect(updateId).toBe(getChallengeLeaderboardFeedId(challenge.id));
      expect(updatedFeed.page.ids).toHaveLength(2);
      expect(updatedFeed.count).toBe(2);
    });
  });

  describe('paginateLeaderboardParticipants', () => {
    it('should return paginated leaderboard entries', async () => {
      const challenge = ChallengeEntityFake();
      const paginationInput = {
        take: 3,
        after: 'after',
        before: 'before',
      };
      const currentUser = UserEntityFake();
      const postIds = ['postId1', 'postId2', 'postId3'];
      const userIds = ['userId1', 'userId2', 'userId3'];
      const ids = Array.from({ length: 3 }, (_, i) => {
        return toChallengeLeaderboardEdge({
          participantId: userIds[i],
          entryCount: i,
          latestEntryId: postIds[i],
        });
      });
      service['userService'].userIdsOfBlockedUsersOnEitherSide = jest
        .fn()
        .mockResolvedValue(['blockedUserId']);
      const users = userIds.map(id => UserEntityFake({ id }));
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);
      const posts = postIds.map(id => PostEntityFake({ id }));
      service['postRepository'].findByIds = jest.fn().mockResolvedValue(posts);
      service['entitiesWithPagesCommon'].paginateEntries = jest
        .fn()
        .mockResolvedValue({
          ids,
          hasMoreItems: true,
          hasPreviousItems: false,
        });
      const result = await service.paginateLeaderboardParticipants({
        challenge,
        paginationInput,
        currentUser,
      });
      expect(result.rawEdges).toHaveLength(3);
      for (let i = 0; i < result.rawEdges.length; i++) {
        // @ts-ignore
        expect(result.rawEdges[i].user).toEqual(users[i]);
        expect(result.rawEdges[i].post).toEqual(posts[i]);
        expect(result.rawEdges[i].cursor).toEqual(ids[i]);
      }
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
      expect(service['userService'].findAllById).toHaveBeenCalledWith(userIds);
      expect(service['postRepository'].findByIds).toHaveBeenCalledWith(postIds);
      expect(
        service['userService'].userIdsOfBlockedUsersOnEitherSide
      ).toHaveBeenCalledWith(currentUser);
    });

    it('should filter out missing users or posts', async () => {
      const challenge = ChallengeEntityFake();
      const paginationInput = {
        take: 3,
        after: 'after',
        before: 'before',
      };
      const currentUser = UserEntityFake();
      const postIds = ['postId1', 'postId2', 'postId3'];
      const userIds = ['userId1', 'userId2', 'userId3'];
      const ids = Array.from({ length: 3 }, (_, i) => {
        return toChallengeLeaderboardEdge({
          participantId: userIds[i],
          entryCount: i,
          latestEntryId: postIds[i],
        });
      });
      service['userService'].userIdsOfBlockedUsersOnEitherSide = jest
        .fn()
        .mockResolvedValue(['blockedUserId']);
      const users = userIds.map(id => {
        if (id === 'userId2') {
          return undefined;
        }
        return UserEntityFake({ id });
      });
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);
      const posts = postIds.map(id => {
        if (id === 'postId3') {
          return undefined;
        }
        return PostEntityFake({ id });
      });
      service['postRepository'].findByIds = jest.fn().mockResolvedValue(posts);
      service['entitiesWithPagesCommon'].paginateEntries = jest
        .fn()
        .mockResolvedValue({
          ids,
          hasNextPage: true,
          hasPreviousPage: false,
        });
      const result = await service.paginateLeaderboardParticipants({
        challenge,
        paginationInput,
        currentUser,
      });
      expect(result.rawEdges).toHaveLength(1);
      // @ts-ignore
      expect(result.rawEdges[0].user).toEqual(users[0]);
      expect(result.rawEdges[0].post).toEqual(posts[0]);
    });

    it('should call entities with pages common paginate entries with correct args', async () => {
      const challenge = ChallengeEntityFake();
      const paginationInput = {
        take: 3,
        after: 'after',
        before: 'before',
      };
      const currentUser = UserEntityFake();
      const postIds = ['postId1', 'postId2', 'postId3'];
      const userIds = ['userId1', 'userId2', 'userId3'];
      const ids = Array.from({ length: 3 }, (_, i) => {
        return toChallengeLeaderboardEdge({
          participantId: userIds[i],
          entryCount: i,
          latestEntryId: postIds[i],
        });
      });
      service['userService'].userIdsOfBlockedUsersOnEitherSide = jest
        .fn()
        .mockResolvedValue(['blockedUserId']);
      service['userService'].toUserObject = jest
        .fn()
        .mockImplementation(user => user);
      const users = userIds.map(id => UserEntityFake({ id }));
      service['userService'].findAllById = jest.fn().mockResolvedValue(users);
      const posts = postIds.map(id => PostEntityFake({ id }));
      service['postRepository'].findByIds = jest.fn().mockResolvedValue(posts);
      service['entitiesWithPagesCommon'].paginateEntries = jest
        .fn()
        .mockResolvedValue({
          ids,
          hasNextPage: true,
          hasPreviousPage: false,
        });
      await service.paginateLeaderboardParticipants({
        challenge,
        paginationInput,
        currentUser,
      });
      const paginateEntriesArgs =
        service[
          'entitiesWithPagesCommon'
          // @ts-ignore
        ].paginateEntries.mock.calls[0];
      const predicate = paginateEntriesArgs[0].predicate;
      expect(
        predicate(
          toChallengeLeaderboardEdge({
            participantId: 'blockedUserId',
            entryCount: 1,
            latestEntryId: 'latestEntryId1',
          })
        )
      ).toBe(false);
      const repo = paginateEntriesArgs[0].repo;
      expect(repo).toBe(service['connection'].getRepository(FeedEntity));
      const entityId = paginateEntriesArgs[0].entityId;
      expect(entityId).toBe(
        getFirstPageId(
          toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challenge.id)
        )
      );
      const paginationInputArg = paginateEntriesArgs[0].paginationInput;
      expect(paginationInputArg).toBe(paginationInput);
    });
  });
});
