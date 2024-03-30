import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { UserService } from './user.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntity } from './user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { OnboardingType } from '@verdzie/server/generated-graphql';
import sinon from 'sinon';
import { getRepositoryToken } from '@nestjs/typeorm';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import { addJoinedChallenge } from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { RealIdVerificationStatus } from '@verdzie/server/real-id/realId';
import {
  RealIdVerificationStatus as GqlRealIdVerificationStatus,
  UserListVisibility as GqlUserListVisibility,
} from '@verdzie/server/generated-graphql';
import { UserListVisibility } from '@verdzie/server/user/data/userListVisibility';

describe('UserService', () => {
  let service: UserService;
  let clock: sinon.SinonFakeTimers;

  beforeAll(() => {
    clock = sinon.useFakeTimers();
  });

  afterAll(() => {
    clock.restore();
  });

  describe('feeds', () => {
    beforeEach(async () => {
      service = (
        await createMockedTestingModule({
          providers: [
            UserService,
            { provide: getRepositoryToken(UserEntity), useValue: {} },
          ],
        })
      ).get(UserService);
    });

    describe('generateFeeds', () => {
      it('should call feedService.createAll with enums and userId', async () => {
        const feeds = Array.from({ length: 2 }, () => new FeedEntity());
        const userId = 'id';
        const enums = [FeedEntityType.FOLLOWER, FeedEntityType.FOLLOWING];
        const createAllStub = jest.fn().mockResolvedValue(feeds);
        service['feedService'].createAll = createAllStub;
        const result = await service['generateFeeds'](userId, enums);
        expect(createAllStub).toHaveBeenCalledWith(enums, userId);
        expect(result).toBe(true);
      });
    });

    describe('skipOnboarding', () => {
      it('should update the users skip time for inner circle onboarding', async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.skipOnboarding(
          { type: OnboardingType.INNER_CIRCLE },
          user
        );
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{innerCircleSkippedAt}', '"${new Date().toISOString()}"'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });

      it('should update the users skip time for comment reply likes onboarding', async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.skipOnboarding(
          { type: OnboardingType.COMMENT_REPLY_LIKES },
          user
        );
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{commentReplyLikesSkippedAt}', '"${new Date().toISOString()}"'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });

      it('should update the users skip time for challenges onboarding', async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.skipOnboarding({ type: OnboardingType.CHALLENGES }, user);
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{challengesSkippedAt}', '"${new Date().toISOString()}"'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });

      it(`should throw if challenge author interactions is skipped`, async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        expect(
          service.skipOnboarding(
            { type: OnboardingType.CHALLENGE_AUTHOR_INTERACTIONS },
            user
          )
        ).rejects.toThrowError(
          'Cannot skip challenge author interactions onboarding'
        );
      });

      it(`should throw if challenge education is skipped`, async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        expect(
          service.skipOnboarding(
            { type: OnboardingType.CHALLENGE_EDUCATION },
            user
          )
        ).rejects.toThrowError('Cannot skip challenge education onboarding');
      });
    });

    describe('finishOnboarding', () => {
      it('should update the users inner circle onboarding status to done', async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.finishOnboarding(
          { type: OnboardingType.INNER_CIRCLE },
          user
        );
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{innerCircle}', 'true'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });

      it('should update the users comment reply likes onboarding stat to done', async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.finishOnboarding(
          { type: OnboardingType.COMMENT_REPLY_LIKES },
          user
        );
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{commentReplyLikes}', 'true'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });

      it('should update the users challenge onboarding status to done', async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.finishOnboarding(
          { type: OnboardingType.CHALLENGES },
          user
        );
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{challenges}', 'true'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });

      it(`should update the user's author interactions onboarding to be complete`, async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.finishOnboarding(
          { type: OnboardingType.CHALLENGE_AUTHOR_INTERACTIONS },
          user
        );
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{challengeAuthorInteractions}', 'true'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });

      it(`should update the user's challenge education to be complete`, async () => {
        const user = UserEntityFake();
        const execute = jest.fn();
        const set = jest.fn().mockReturnValue({ execute });
        const where = jest.fn().mockReturnValue({ set });
        const update = jest.fn().mockReturnValue({ where });
        service['repo'].createQueryBuilder = jest.fn().mockReturnValue({
          update,
        });
        await service.finishOnboarding(
          { type: OnboardingType.CHALLENGE_EDUCATION },
          user
        );
        expect(update).toHaveBeenCalledWith(user);
        expect(where).toHaveBeenCalledWith({ id: user.id });
        const setCall = set.mock.calls[0][0];
        expect(setCall.onboardingStats()).toEqual(
          `jsonb_set(onboarding_stats, '{challengeEducation}', 'true'::jsonb)`
        );
        expect(execute).toHaveBeenCalledTimes(1);
      });
    });

    describe('getOnboardingStats', () => {
      it('should return inner circle as true if user has finished onboarding', async () => {
        const user = UserEntityFake();
        user.onboardingStats = { innerCircle: true };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.innerCircle).toBe(true);
      });

      it('should return inner circle true if the user has skipped onboarding in the past two days', async () => {
        const user = UserEntityFake();
        user.onboardingStats = {
          innerCircleSkippedAt: new Date(Date.now()).toISOString(),
        };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.innerCircle).toBe(true);
      });

      /**
       * @deprecated No longer performing date check on InnerCircle onboarding status stats
       */
      /*it('should return inner circle false if skipped more then two days ago', async () => {
        const user = UserEntityFake();
        const threeDaysMs = 1000 * 60 * 60 * 24 * 3;
        user.onboardingStats = {
          innerCircleSkippedAt: new Date(
            Date.now() - threeDaysMs
          ).toISOString(),
        };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.innerCircle).toBe(false);
      });*/

      it('should return inner circle true if skipped', async () => {
        const user = UserEntityFake();
        const threeDaysMs = 1000 * 60 * 60 * 24 * 3;
        user.onboardingStats = {
          innerCircleSkippedAt: new Date(
            Date.now() - threeDaysMs
          ).toISOString(),
        };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.innerCircle).toBe(true);
      });

      it('should return comment reply likes as true if user has finished onboarding', async () => {
        const user = UserEntityFake();
        user.onboardingStats = { commentReplyLikes: true };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.commentReplyLikes).toBe(true);
      });

      it('should return comment reply likes true if the user has skipped onboarding in the past two days', async () => {
        const user = UserEntityFake();
        user.onboardingStats = {
          commentReplyLikesSkippedAt: new Date(Date.now()).toISOString(),
        };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.commentReplyLikes).toBe(true);
      });

      //No longer in use
      it('should return comment reply likes true if has skipped the onboarding', async () => {
        const user = UserEntityFake();
        const threeDaysMs = 1000 * 60 * 60 * 24 * 3;
        user.onboardingStats = {
          commentReplyLikesSkippedAt: new Date(
            Date.now() - threeDaysMs
          ).toISOString(),
        };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.commentReplyLikes).toBe(true);
      });

      it('should return challenges as complete if user has finished onboarding', async () => {
        const user = UserEntityFake();
        user.onboardingStats = { challenges: true };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.challenges).toBe(true);
      });

      it('should return challenges onboarding as complete if the user has skipped onboarding in the past two days', async () => {
        const user = UserEntityFake();
        user.onboardingStats = {
          challengesSkippedAt: new Date(Date.now()).toISOString(),
        };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.challenges).toBe(true);
      });

      it('should return challenges as complete if skipped more then two days ago', async () => {
        const user = UserEntityFake();
        const threeDaysMs = 1000 * 60 * 60 * 24 * 3;
        user.onboardingStats = {
          challengesSkippedAt: new Date(Date.now() - threeDaysMs).toISOString(),
        };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.challenges).toBe(false);
      });

      it('should return challenges education as false if challengeContext is null in UserEntity', async () => {
        const user = UserEntityFake();
        user.challengeContext = undefined;
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.challengeEducation).toBe(false);
      });

      it('should return challenges education as true if challengeContext is not null in UserEntity even if ChallengeEducation is false', async () => {
        const user = UserEntityFake();
        user.challengeContext = {};
        user.onboardingStats = { challengeEducation: false };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.challengeEducation).toBe(true);
      });

      it('should return challenges education as true if challengeContext is not null in UserEntity even if ChallengeEducation is undefined', async () => {
        const user = UserEntityFake();
        user.challengeContext = {};
        user.onboardingStats = { challengeEducation: undefined };
        service['findById'] = jest.fn().mockResolvedValue(user);
        const result = await service.getOnboardingStats(user);
        expect(result.challengeEducation).toBe(true);
      });
    });

    describe('requestReIndex', () => {
      it('should request incremental re-indexing of the user', async () => {
        const userId = 'userId';

        service['incrementalIndexStateWorker'].requestIncrementalIndex =
          jest.fn();

        await service.requestReIndex(userId);

        expect(
          service['incrementalIndexStateWorker'].requestIncrementalIndex
        ).toHaveBeenCalledWith({
          entityName: 'UserEntity',
          entityId: userId,
        });
      });
    });
  });

  describe('updateUserTimezoneOffset', () => {
    it('should set the users localization data', async () => {
      const user = UserEntityFake();
      const builder = {
        set: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      };
      const createQueryBuilder = jest.fn().mockReturnValue(builder);
      service['repo'].createQueryBuilder = createQueryBuilder;
      const result = await service.updateUserTimezoneOffset({
        userId: user.id,
        offset: '-1:00',
      });
      expect(createQueryBuilder).toHaveBeenCalled();
      const setFn = builder.set.mock.calls[0][0].localizationData;
      expect(setFn()).toEqual(
        `jsonb_set(COALESCE(localization_data, '{}'), '{timezoneOffset}', '"-1:00"'::jsonb, true)`
      );
      expect(builder.update).toHaveBeenCalledWith(UserEntity);
      expect(builder.where).toHaveBeenCalledWith({ id: user.id });
      expect(builder.execute).toHaveBeenCalledTimes(1);
      expect(result.isOk()).toBe(true);
    });

    it('should catch errors during update', async () => {
      const user = UserEntityFake();
      const builder = {
        set: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('error')),
      };
      const createQueryBuilder = jest.fn().mockReturnValue(builder);
      service['repo'].createQueryBuilder = createQueryBuilder;
      const result = await service.updateUserTimezoneOffset({
        userId: user.id,
        offset: '-1:00',
      });
      expect(createQueryBuilder).toHaveBeenCalled();
      const setFn = builder.set.mock.calls[0][0].localizationData;
      expect(setFn()).toEqual(
        `jsonb_set(COALESCE(localization_data, '{}'), '{timezoneOffset}', '"-1:00"'::jsonb, true)`
      );
      expect(builder.update).toHaveBeenCalledWith(UserEntity);
      expect(builder.where).toHaveBeenCalledWith({ id: user.id });
      expect(builder.execute).toHaveBeenCalledTimes(1);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('toUserObject', () => {
    const signedUrl = 's3://fake-bucket/fake-key?key=ajfleaifoe';

    beforeEach(async () => {
      service = (
        await createMockedTestingModule({
          providers: [
            UserService,
            { provide: getRepositoryToken(UserEntity), useValue: {} },
            {
              provide: S3UrlPreSigner,
              useValue: {
                presign: jest.fn().mockResolvedValue(signedUrl),
              },
            },
          ],
        })
      ).get(UserService);
    });

    describe('public', () => {
      it('should return a user object with strike data', async () => {
        const user = UserEntityFake();
        user.strikeData = {
          isSuspended: false,
          currentStrikeCount: 0,
          firstStrikeCount: 1,
          firstStrikeTS: new Date(),
          firstStrikeExpiryTS: new Date(),
          secondStrikeCount: 0,
          thirdStrikeCount: 0,
          permanentSuspensionCount: 0,
        };
        const userObject = service.toUserObject({
          user,
        });
        expect(userObject.strikeData).toEqual({
          isFaded: false,
          score: undefined,
        });
      });

      it('should return a result with stats zeroed out if user is blocked', async () => {
        const user = UserEntityFake();
        user._stats = {
          followerCount: 1,
          followingCount: 2,
          postCount: 3,
          innerCircleCount: 4,
        };
        const userObject = service.toUserObject({
          user,
          hasBlocked: true,
        });
        expect(userObject.stats).toEqual({
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
          innerCircleCount: 0,
          joinedChallengesCount: 0,
          createdChallengesCount: 0,
        });
      });

      it('should not return email and phone number', async () => {
        const user = UserEntityFake();
        const userObject = service.toUserObject({
          user,
        });
        expect(userObject.email).toBeUndefined();
        expect(userObject.phoneNumber).toBeUndefined();
      });

      it(`should zero out follower/following stats if visibility is set to 'NONE'`, async () => {
        const user = UserEntityFake();
        user._stats = {
          followerCount: 1,
          followingCount: 2,
          postCount: 3,
          innerCircleCount: 4,
        };
        user.visibilityPreferences = {
          list: {
            follower: UserListVisibility.NONE,
            following: UserListVisibility.NONE,
          },
        };
        const userObject = service.toUserObject({
          user,
        });
        expect(userObject.stats).toEqual({
          followerCount: 0,
          followingCount: 0,
          innerCircleCount: 0,
          postCount: 3,
          joinedChallengesCount: 0,
          createdChallengesCount: 0,
        });
      });
    });

    describe('public and private', () => {
      it('should return a return a user object with user info', async () => {
        const user = UserEntityFake({
          bio: 'tree',
          handle: 'tree',
          name: 'ada lovelace',
          pronoun: 'tree',
          score: 1,
          isSuspended: false,
          realIdVerificationStatus: RealIdVerificationStatus.VERIFIED,
        });
        const userObjects = [
          service.toUserObject({
            user,
          }),
          service.toUserObject({
            user,
            isCurrentUserRequestingTheirDetails: true,
          }),
        ];
        userObjects.forEach(userObject => {
          expect(userObject.id).toEqual(user.id);
          expect(userObject.bio).toEqual(user.bio);
          expect(userObject.handle).toEqual(user.handle);
          expect(userObject.name).toEqual(user.name);
          expect(userObject.pronoun).toEqual(user.pronoun);
          expect(userObject.score).toEqual(user.score);
          expect(userObject.isSuspended).toEqual(user.isSuspended);
          expect(userObject.realIdVerificationStatus).toEqual(
            GqlRealIdVerificationStatus.VERIFIED
          );
          expect(userObject.isAvailable).toEqual(true);
        });
      });

      it('should return the user object with stats', async () => {
        const user = UserEntityFake();
        const stats = {
          followingCount: 1,
          followerCount: 2,
          postCount: 3,
          innerCircleCount: 4,
        };
        user.challengeContext = {
          joinedChallenges: [],
        };
        const challenge = ChallengeEntityFake();
        const ownedChallenge = ChallengeEntityFake({ authorId: user.id });
        addJoinedChallenge({ challenge, user });
        addJoinedChallenge({ challenge: ownedChallenge, user });
        user._stats = stats;
        const userObjects = [
          service.toUserObject({
            user,
          }),
          service.toUserObject({
            user,
            isCurrentUserRequestingTheirDetails: true,
          }),
        ];
        userObjects.forEach(userObject => {
          userObject.stats = {
            __typename: 'UserStats',
            ...stats,
            joinedChallengesCount: 2,
            createdChallengesCount: 1,
          };
        });
      });

      it('should return a user with visibility preferences', async () => {
        const user = UserEntityFake();
        user.visibilityPreferences = {
          list: {
            follower: UserListVisibility.EVERYONE,
            following: UserListVisibility.FOLLOWERS,
          },
        };
        const userObjects = [
          service.toUserObject({
            user,
          }),
          service.toUserObject({
            user,
            isCurrentUserRequestingTheirDetails: true,
          }),
        ];
        userObjects.forEach(userObject => {
          expect(userObject.visibilityPreferences).toEqual({
            list: {
              follower: GqlUserListVisibility.EVERYONE,
              following: GqlUserListVisibility.FOLLOWERS,
            },
          });
        });
      });

      it('should return a user with an avatar image', async () => {
        const user = UserEntityFake();
        const userObjects = [
          service.toUserObject({
            user,
          }),
          service.toUserObject({
            user,
            isCurrentUserRequestingTheirDetails: true,
          }),
        ];
        userObjects.forEach(userObject => {
          expect(userObject.avatarImage?.__typename).toEqual('MediaSource');
          expect(userObject.avatarImage?.uri.toString()).toEqual(
            '[object Promise]'
          );
        });
      });
    });

    describe('private', () => {
      it('should include email and phone number', async () => {
        const email = 'brian@brian.com';
        const phoneNumber = '555-555-5555';
        const user = UserEntityFake({
          email,
          phoneNumber,
        });
        const userObject = service.toUserObject({
          user,
          isCurrentUserRequestingTheirDetails: true,
        });
        expect(userObject.email).toEqual(email);
        expect(userObject.phoneNumber).toEqual(phoneNumber);
      });
    });
  });
});
