import {
  ChallengeInteraction,
  ChallengeInteractionEnum,
  ChallengeInteractionService,
} from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { getStartAndEndDateInUTC, newAppContext } from '@verdzie/server/common';
import { addJoinedChallenge } from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';

describe('ChallengeInteractionService', () => {
  let service: ChallengeInteractionService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ChallengeInteractionService],
    });
    service = module.get(ChallengeInteractionService);
    jest.useFakeTimers();
  });

  describe('toChallengeInteractionEdge', () => {
    it('should return a challenge interaction edge', () => {
      jest.setSystemTime(0);
      const result = service.toChallengeInteractionEdge({
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId: '1',
      });
      const { dateMs, interactionType, objectId } = JSON.parse(result);
      expect(dateMs).toBe(Date.now());
      expect(interactionType).toBe(ChallengeInteractionEnum.COMMENTED);
      expect(objectId).toBe('1');
    });
  });

  describe('fromChallengeInteractionEdge', () => {
    it('should return a challenge interaction', () => {
      const result = service.fromChallengeInteractionEdge(
        JSON.stringify({
          dateMs: 0,
          interactionType: ChallengeInteractionEnum.COMMENTED,
          objectId: '1',
        })
      );
      expect(result.dateMs).toBe(0);
      expect(result.interactionType).toBe(ChallengeInteractionEnum.COMMENTED);
      expect(result.objectId).toBe('1');
    });
  });

  describe('addChallengeInteractionToFeed', () => {
    it('should add a challenge interaction edge to the feed', () => {
      const feed = service.addChallengeInteractionToFeed({
        feed: {
          page: {
            ids: [],
          },
          count: 0,
        } as any,
        objectId: '1',
        interactionType: ChallengeInteractionEnum.COMMENTED,
      });
      expect(feed.page.ids.length).toBe(1);
      expect(
        service.fromChallengeInteractionEdge(feed.page.ids[0]).objectId
      ).toBe('1');
    });

    it('should update the feeds count', () => {
      const feed = service.addChallengeInteractionToFeed({
        feed: {
          page: {
            ids: [],
          },
          count: 0,
        } as any,
        objectId: '1',
        interactionType: ChallengeInteractionEnum.COMMENTED,
      });
      expect(feed.count).toBe(1);
    });
  });

  describe('getTodaysChallengeInteractionsFromFeed', () => {
    it('should return todays challenge interactions from the feed', () => {
      const feed = FeedEntityFake();
      feed.page.ids = [];
      jest.setSystemTime(0);
      service.addChallengeInteractionToFeed({
        feed,
        objectId: '1',
        interactionType: ChallengeInteractionEnum.COMMENTED,
      });
      const result = service.getChallengeInteractionsForTodayFromFeed({
        feed,
        timezoneOffset: '00:00',
      });
      expect(result.length).toBe(1);
    });

    it('should return todays challenge interactions relative to negative offset timezones', () => {
      const feed = FeedEntityFake();
      feed.page.ids = [];
      // Set time to 18:00 UTC 14:00 New York
      jest.setSystemTime(1000 * 60 * 60 * 18);
      service.addChallengeInteractionToFeed({
        feed,
        objectId: '1',
        interactionType: ChallengeInteractionEnum.COMMENTED,
      });
      // Set time to 1:00 UTC
      jest.setSystemTime(1000 * 60 * 60 * 25);
      const result = service.getChallengeInteractionsForTodayFromFeed({
        feed,
        timezoneOffset: '00:00',
      });
      // Should be zero since it is already the next day in UTC
      expect(result.length).toBe(0);
      const result2 = service.getChallengeInteractionsForTodayFromFeed({
        feed,
        timezoneOffset: '-04:00',
      });
      // Should be one since it is still the same day in New York
      expect(result2.length).toBe(1);
    });

    it('should return todays challenge interactions relative to positive offset timezones', () => {
      const feed = FeedEntityFake();
      feed.page.ids = [];
      // Set time to 23:00 UTC
      jest.setSystemTime(1000 * 60 * 60 * 23);
      service.addChallengeInteractionToFeed({
        feed,
        objectId: '1',
        interactionType: ChallengeInteractionEnum.COMMENTED,
      });
      const result = service.getChallengeInteractionsForTodayFromFeed({
        feed,
        timezoneOffset: '00:00',
      });
      // Should be one since interaction was added at 23:00 UTC
      expect(result.length).toBe(1);
      const result2 = service.getChallengeInteractionsForTodayFromFeed({
        feed,
        timezoneOffset: 'Europe/Berlin',
      });
      // Should be zero since it is already the next day in Berlin
      expect(result2.length).toBe(0);
    });
  });

  describe('updateChallengeInteractionsForAuthor', () => {
    it('should return if the current user has not created any challenges (based on stats)', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({ authorId: currentUser.id });
      addJoinedChallenge({ challenge, user: currentUser });
      const post = PostEntityFake();
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId: '1',
        currentUser,
        context: newAppContext(),
      });
      expect(result).toEqual({ interactionAdded: false });
    });

    it('should return if the post does not have a parent challenge', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake();
      addJoinedChallenge({ user: currentUser, challenge });
      const post = PostEntityFake();
      post.parentChallengeId = undefined;
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId: '1',
        currentUser,
        context: newAppContext(),
      });
      expect(result).toEqual({ interactionAdded: false });
    });

    it('should return false if challenge is not found', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake();
      addJoinedChallenge({ user: currentUser, challenge });
      const post = PostEntityFake();
      post.parentChallengeId = '1';
      service['feedService'].repo = {
        manager: {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(undefined),
          }),
        },
      } as any;
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId: '1',
        currentUser,
        context: newAppContext(),
      });
      expect(result).toEqual({ interactionAdded: false });
    });

    it('should return false if user is not the author', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake();
      addJoinedChallenge({ user: currentUser, challenge });
      const post = PostEntityFake();
      post.parentChallengeId = '1';
      service['feedService'].repo = {
        manager: {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(undefined),
          }),
        },
      } as any;
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId: '1',
        currentUser,
        context: newAppContext(),
      });
      expect(result).toEqual({ interactionAdded: false });
    });

    it('should return false if user is not the author', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake();
      addJoinedChallenge({ user: currentUser, challenge });
      const post = PostEntityFake();
      post.parentChallengeId = '1';
      service['feedService'].repo = {
        manager: {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(undefined),
          }),
        },
      } as any;
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId: '1',
        currentUser,
        context: newAppContext(),
      });
      expect(result).toEqual({ interactionAdded: false });
    });

    it('should return true if the challenge interaction was added', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
        id: 'challenge-id',
      });
      addJoinedChallenge({ user: currentUser, challenge });
      const post = PostEntityFake({
        parentChallengeId: challenge.id,
        parentChallenge: challenge,
      });
      const objectId = 'objectId';
      service['feedService'].createIfNotExists = jest.fn();
      const feedEntity = FeedEntityFake({
        id: `${FeedEntityType.CHALLENGE_AUTHOR_INTERACTIONS}:${challenge.id}:${currentUser.id}~#001`,
      });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feedEntity),
        update: jest.fn(),
      };
      const transactionManager = {
        getRepository: jest.fn().mockImplementation(targetEntity => {
          expect(targetEntity).toBe(FeedEntity);
          return feedRepo;
        }),
      };
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async (isoLevel, tx) => {
            return await tx(transactionManager);
          }),
        },
      };
      jest.setSystemTime(0);
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId,
        currentUser,
        context: newAppContext(),
      });
      expect(feedRepo.findOne).toHaveBeenCalledWith(feedEntity.id);
      const updateCall = feedRepo.update.mock.calls[0];
      expect(updateCall[0]).toBe(feedEntity.id);
      expect(updateCall[1]._count).toBe(1);
      expect(updateCall[1].ids).toHaveLength(1);
      expect(result).toEqual({ interactionAdded: true });
      const parsedInteraction = service.fromChallengeInteractionEdge(
        updateCall[1].ids[0]
      );
      expect(parsedInteraction).toEqual({
        objectId,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        dateMs: 0,
      });
    });

    it('should update the app context if a an interaction was added', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
        id: 'challenge-id',
      });
      addJoinedChallenge({ user: currentUser, challenge });
      const post = PostEntityFake({
        parentChallengeId: challenge.id,
        parentChallenge: challenge,
      });
      const objectId = 'objectId';
      service['feedService'].createIfNotExists = jest.fn();
      const feedEntity = FeedEntityFake({
        id: `${FeedEntityType.CHALLENGE_AUTHOR_INTERACTIONS}:${challenge.id}:${currentUser.id}~#001`,
      });
      feedEntity.count = 0;
      feedEntity.page.ids = [];
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feedEntity),
        update: jest.fn(),
      };
      const transactionManager = {
        getRepository: jest.fn().mockImplementation(targetEntity => {
          expect(targetEntity).toBe(FeedEntity);
          return feedRepo;
        }),
      };
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async (isoLevel, tx) => {
            return await tx(transactionManager);
          }),
        },
      };
      jest.setSystemTime(0);
      const context = newAppContext();
      await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId,
        currentUser,
        context,
      });
      expect(context.challengeInteractionData.interactionCount).toBe(1);
      expect(context.challengeInteractionData.challenge).toBe(challenge);
    });

    it('should add interactions for author when passed challenge', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
        id: 'challenge-id',
      });
      addJoinedChallenge({ user: currentUser, challenge });
      const objectId = 'objectId';
      service['feedService'].createIfNotExists = jest.fn();
      const feedEntity = FeedEntityFake({
        id: `${FeedEntityType.CHALLENGE_AUTHOR_INTERACTIONS}:${challenge.id}:${currentUser.id}~#001`,
      });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feedEntity),
        update: jest.fn(),
      };
      const transactionManager = {
        getRepository: jest.fn().mockImplementation(targetEntity => {
          expect(targetEntity).toBe(FeedEntity);
          return feedRepo;
        }),
      };
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async (isoLevel, tx) => {
            return await tx(transactionManager);
          }),
        },
      };
      jest.setSystemTime(0);
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: challenge,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId,
        currentUser,
        context: newAppContext(),
      });
      expect(feedRepo.findOne).toHaveBeenCalledWith(feedEntity.id);
      const updateCall = feedRepo.update.mock.calls[0];
      expect(updateCall[0]).toBe(feedEntity.id);
      expect(updateCall[1]._count).toBe(1);
      expect(updateCall[1].ids).toHaveLength(1);
      expect(result).toEqual({ interactionAdded: true });
      const parsedInteraction = service.fromChallengeInteractionEdge(
        updateCall[1].ids[0]
      );
      expect(parsedInteraction).toEqual({
        objectId,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        dateMs: 0,
      });
    });

    it('should create a new feed if one does not exist', async () => {
      const currentUser = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: currentUser.id,
        id: 'challenge-id',
      });
      addJoinedChallenge({ user: currentUser, challenge });
      const post = PostEntityFake({
        parentChallengeId: challenge.id,
        parentChallenge: challenge,
      });
      const objectId = 'objectId';
      service['feedService'].createIfNotExists = jest.fn();
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(undefined),
        insert: jest.fn(),
      };
      const transactionManager = {
        getRepository: jest.fn().mockImplementation(targetEntity => {
          expect(targetEntity).toBe(FeedEntity);
          return feedRepo;
        }),
      };
      service['feedService'].repo = {
        // @ts-ignore
        manager: {
          transaction: jest.fn().mockImplementation(async (isoLevel, tx) => {
            return await tx(transactionManager);
          }),
        },
      };
      jest.setSystemTime(0);
      const result = await service.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        objectId,
        currentUser,
        context: newAppContext(),
      });
      expect(feedRepo.findOne).toHaveBeenCalledWith(
        `${FeedEntityType.CHALLENGE_AUTHOR_INTERACTIONS}:${challenge.id}:${currentUser.id}~#001`
      );
      const updateCall = feedRepo.insert.mock.calls[0];
      expect(updateCall[0]._count).toBe(1);
      expect(updateCall[0].ids).toHaveLength(1);
      expect(result).toEqual({ interactionAdded: true });
      const parsedInteraction = service.fromChallengeInteractionEdge(
        updateCall[0].ids[0]
      );
      expect(parsedInteraction).toEqual({
        objectId,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        dateMs: 0,
      });
    });
  });

  describe('getChallengeAuthorInteractionsForToday', () => {
    const currentUser = UserEntityFake();
    const challengeId = '1';

    function expectResult(
      result: ChallengeInteraction[],
      timezoneOffset: string
    ) {
      expect(result.length).toBe(1);
      getLogger().info({ timezoneOffset, date: new Date(result[0].dateMs) });
      // expect(new Date(result[0].dateMs).getUTCHours()).toBe(expectHour);
    }

    async function testCode(timezoneOffset: string) {
      service['feedService'].repo = {
        findOne: jest.fn().mockResolvedValue(
          FeedEntityFake({
            id: `${FeedEntityType.CHALLENGE_AUTHOR_INTERACTIONS}:${challengeId}:${currentUser.id}`,
            page: {
              ids: [
                service.toChallengeInteractionEdge({
                  interactionType: ChallengeInteractionEnum.COMMENTED,
                  objectId: '1',
                }),
                JSON.stringify({
                  dateMs: 1000000000000000,
                  objectId: '2',
                  interactionType: ChallengeInteractionEnum.PINNED_COMMENT,
                }),
              ],
              idsWithScore: {
                idsMap: {},
              },
            },
          })
        ),
      } as any;
      const result = await service.getChallengeAuthorInteractionsForToday({
        currentUser,
        challengeId,
        timezoneOffset,
      });
      expectResult(result, timezoneOffset);
    }

    it('tz-offset -14:00', async () => {
      const timezoneOffset = '-14:00';
      await testCode(timezoneOffset);
    });
    it('tz-offset -7:00 [PST]', async () => {
      const timezoneOffset = '-07:00';
      await testCode(timezoneOffset);
    });
    it('tz-offset -1:00', async () => {
      const timezoneOffset = '-01:00';
      await testCode(timezoneOffset);
    });
    it('tz-offset 00:00 [UTC]', async () => {
      const timezoneOffset = '00:00';
      await testCode(timezoneOffset);
    });
    it('tz-offset 07:00', async () => {
      const timezoneOffset = '07:00';
      await testCode(timezoneOffset);
    });
    it('tz-offset 10:30', async () => {
      const timezoneOffset = '10:30';
      await testCode(timezoneOffset);
    });
    it('tz-offset 14:00', async () => {
      const timezoneOffset = '14:00';
      await testCode(timezoneOffset);
    });

    function formatTimeZoneOffset(offsetMinutes: number): string {
      const sign = offsetMinutes < 0 ? '-' : '+';
      const absMinutes = Math.abs(offsetMinutes);
      const hours = Math.floor(absMinutes / 60);
      const minutes = absMinutes % 60;
      return `${sign}${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    }

    it('from, -14:00 to 14:00', async () => {
      for (
        let offsetMinutes = -14 * 60;
        offsetMinutes <= 14 * 60;
        offsetMinutes += 30
      ) {
        const timeZoneOffset: string = formatTimeZoneOffset(offsetMinutes);
        const { startDate, endDate } = getStartAndEndDateInUTC(timeZoneOffset);
        const startDateTime =
          'Date: ' +
          startDate.getUTCDate() +
          '; ' +
          startDate.getUTCHours() +
          ':' +
          startDate.getUTCMinutes();
        const endDateTime =
          'Date: ' +
          endDate.getUTCDate() +
          '; ' +
          endDate.getUTCHours() +
          ':' +
          endDate.getUTCMinutes();
        getLogger().info({
          timeZoneOffset,
          startDateTime,
          endDateTime,
        });
        await testCode(timeZoneOffset);
      }
    });
  });
});
