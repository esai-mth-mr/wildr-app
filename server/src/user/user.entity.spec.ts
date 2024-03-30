import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  addJoinedChallenge,
  removeJoinedChallenge,
} from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { wait } from '@verdzie/server/common/transaction-result';
import { LinkSourceType } from '@verdzie/server/generated-graphql';
import {
  AlreadyJoinedWildrcoinWaitlistException,
  UserBannerData,
  UserEntity,
} from '@verdzie/server/user/user.entity';

describe('UserEntity', () => {
  describe('setStats', () => {
    it('should default to empty stats', () => {
      const user = new UserEntity();
      user.setStats({});
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should set follower count if provided', () => {
      const user = new UserEntity();
      user.setStats({ followerCount: 1 });
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should set following count if provided', () => {
      const user = new UserEntity();
      user.setStats({ followingCount: 1 });
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 1,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should set inner circle count if provided', () => {
      const user = new UserEntity();
      user.setStats({ innerCircleCount: 1 });
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 1,
        postCount: 0,
      });
    });

    it('should set post count if provided', () => {
      const user = new UserEntity();
      user.setStats({ postCount: 1 });
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 1,
      });
    });

    it('should set all stats if provided', () => {
      const user = new UserEntity();
      user.setStats({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      });
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      });
    });

    it('should not allow negative follower count', () => {
      const user = new UserEntity();
      user.setStats({ followerCount: -1 });
      expect(user._stats?.followerCount).toBe(0);
    });

    it('should not allow negative following count', () => {
      const user = new UserEntity();
      user.setStats({ followingCount: -1 });
      expect(user._stats?.followingCount).toBe(0);
    });

    it('should not allow negative inner circle count', () => {
      const user = new UserEntity();
      user.setStats({ innerCircleCount: -1 });
      expect(user._stats?.innerCircleCount).toBe(0);
    });

    it('should not allow negative post count', () => {
      const user = new UserEntity();
      user.setStats({ postCount: -1 });
      expect(user._stats?.postCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return a reference to the stats property', () => {
      const user = new UserEntity();
      user.getStats().followerCount = 1;
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should return empty stats if stats property is undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      expect(user.getStats()).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should return empty stats referenced on the user', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.getStats().followerCount = 1;
      expect(user.getStats()).toEqual({
        followerCount: 1,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });
  });

  describe('getComputedStats', () => {
    it('should return return defined user stats', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      };
      expect(user.getComputedStats()).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
        joinedChallengesCount: 0,
        createdChallengesCount: 0,
      });
    });

    it('should return joinedChallengesCount', () => {
      const user = new UserEntity();
      user.id = 'user-id';
      user._stats = {
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      };
      addJoinedChallenge({ user, challenge: new ChallengeEntity() });
      expect(user.getComputedStats()).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
        joinedChallengesCount: 1,
        createdChallengesCount: 0,
      });
    });

    it('should not count challenges the user has left', () => {
      const user = new UserEntity();
      user.id = 'user-id';
      user._stats = {
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      };
      const challenge = new ChallengeEntity();
      addJoinedChallenge({ user, challenge });
      removeJoinedChallenge({ user, challengeId: challenge.id });
      expect(user.getComputedStats()).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
        joinedChallengesCount: 0,
        createdChallengesCount: 0,
      });
    });

    it('should return createdChallengesCount', () => {
      const user = new UserEntity();
      user.id = 'user-id';
      user._stats = {
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      };
      const challenge = new ChallengeEntity();
      challenge.authorId = user.id;
      addJoinedChallenge({ user, challenge });
      expect(user.getComputedStats()).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
        joinedChallengesCount: 1,
        createdChallengesCount: 1,
      });
    });
  });

  describe('incrementPostCount', () => {
    it('should increment post count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      };
      user.incrementPostCount();
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 5,
      });
    });

    it('should increment post count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.incrementPostCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 1,
      });
    });
  });

  describe('decrementPostCount', () => {
    it('should decrement post count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 4,
      };
      user.decrementPostCount();
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 3,
      });
    });

    it('should decrement post count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.decrementPostCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should not allow negative post count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 0,
      };
      user.decrementPostCount();
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 2,
        innerCircleCount: 3,
        postCount: 0,
      });
    });
  });

  describe('incrementFollowerCount', () => {
    it('should increment follower count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 1,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      };
      user.incrementFollowerCount();
      expect(user._stats).toEqual({
        followerCount: 2,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should increment follower count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.incrementFollowerCount();
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });
  });

  describe('decrementFollowerCount', () => {
    it('should decrement follower count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 2,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      };
      user.decrementFollowerCount();
      expect(user._stats).toEqual({
        followerCount: 1,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should decrement follower count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.decrementFollowerCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should not allow negative follower count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      };
      user.decrementFollowerCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });
  });

  describe('incrementFollowingCount', () => {
    it('should increment following count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 0,
        followingCount: 1,
        innerCircleCount: 0,
        postCount: 0,
      };
      user.incrementFollowingCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 2,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should increment following count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.incrementFollowingCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 1,
        innerCircleCount: 0,
        postCount: 0,
      });
    });
  });

  describe('decrementFollowingCount', () => {
    it('should decrement following count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 0,
        followingCount: 2,
        innerCircleCount: 0,
        postCount: 0,
      };
      user.decrementFollowingCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 1,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should decrement following count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.decrementFollowingCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should not allow negative following count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      };
      user.decrementFollowingCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });
  });

  describe('incrementInnerCircleCount', () => {
    it('should increment inner circle count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 1,
        postCount: 0,
      };
      user.incrementInnerCircleCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 2,
        postCount: 0,
      });
    });

    it('should increment inner circle count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.incrementInnerCircleCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 1,
        postCount: 0,
      });
    });
  });

  describe('decrementInnerCircleCount', () => {
    it('should decrement inner circle count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 2,
        postCount: 0,
      };
      user.decrementInnerCircleCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 1,
        postCount: 0,
      });
    });

    it('should decrement inner circle count when stats are undefined', () => {
      const user = new UserEntity();
      user._stats = undefined;
      user.decrementInnerCircleCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });

    it('should not allow negative inner circle count', () => {
      const user = new UserEntity();
      user._stats = {
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      };
      user.decrementInnerCircleCount();
      expect(user._stats).toEqual({
        followerCount: 0,
        followingCount: 0,
        innerCircleCount: 0,
        postCount: 0,
      });
    });
  });

  describe(UserEntity.prototype.skipBanner, () => {
    it('should skip a given banner', async () => {
      const user = new UserEntity();
      const before = new Date();
      await wait(2);
      user.skipBanner({ bannerId: 'banner-id' });
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          ['banner-id']: {
            skipCount: 1,
            lastSkippedAt: expect.any(String),
          },
        },
      };
      expect(user.bannerData).toEqual(expectedBannerData);
      const lastSkippedAt =
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt;
      const lastSkippedAtTime = lastSkippedAt
        ? new Date(lastSkippedAt).getTime()
        : 0;
      expect(lastSkippedAtTime).toBeGreaterThan(before.getTime());
    });

    it('should increment skip count if banner has already been skipped', async () => {
      const user = new UserEntity();
      user.skipBanner({ bannerId: 'banner-id' });
      await wait(2);
      const before = new Date(
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt ?? 0
      );
      user.skipBanner({ bannerId: 'banner-id' });
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          ['banner-id']: {
            skipCount: 2,
            lastSkippedAt: expect.any(String),
          },
        },
      };
      expect(user.bannerData).toEqual(expectedBannerData);
      const lastSkippedAt =
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt;
      const lastSkippedAtTime = lastSkippedAt
        ? new Date(lastSkippedAt).getTime()
        : 0;
      expect(lastSkippedAtTime).toBeGreaterThan(before.getTime());
    });

    it('should not overwrite other banner interactions', async () => {
      const user = new UserEntity();
      user.bannerData = {
        bannerInteractions: {
          ['other-banner-id']: {
            skipCount: 1,
            lastSkippedAt: new Date().toISOString(),
          },
        },
      };
      const before = new Date();
      await wait(2);
      user.skipBanner({ bannerId: 'banner-id' });
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          ['other-banner-id']: {
            skipCount: 1,
            lastSkippedAt: expect.any(String),
          },
          ['banner-id']: {
            skipCount: 1,
            lastSkippedAt: expect.any(String),
          },
        },
      };
      expect(user.bannerData).toEqual(expectedBannerData);
      const lastSkippedAt =
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt;
      const lastSkippedAtTime = lastSkippedAt
        ? new Date(lastSkippedAt).getTime()
        : 0;
      expect(lastSkippedAtTime).toBeGreaterThan(before.getTime());
    });

    it('should not overwrite a banner completion', async () => {
      const user = new UserEntity();
      const completedAt = new Date().toISOString();
      user.bannerData = {
        bannerInteractions: {
          ['banner-id']: {
            skipCount: 0,
            lastSkippedAt: new Date().toISOString(),
            completedAt,
          },
        },
      };
      const before = new Date();
      await wait(2);
      user.skipBanner({ bannerId: 'banner-id' });
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          ['banner-id']: {
            skipCount: 1,
            lastSkippedAt: new Date().toISOString(),
            completedAt,
          },
        },
      };
      expect(user.bannerData).toEqual(expectedBannerData);
      const lastSkippedAt =
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt;
      const lastSkippedAtTime = lastSkippedAt
        ? new Date(lastSkippedAt).getTime()
        : 0;
      expect(lastSkippedAtTime).toBeGreaterThan(before.getTime());
    });
  });

  describe(UserEntity.prototype.isOnWildrCoinWaitlist.name, () => {
    it('should return true if user is on waitlist', () => {
      const user = new UserEntity();
      user.wildrcoinData = {
        waitlistParticipationEvents: [
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      expect(user.isOnWildrCoinWaitlist()).toBe(true);
    });

    it('should return false if user is not on waitlist', () => {
      const user = new UserEntity();
      user.wildrcoinData = undefined;
      expect(user.isOnWildrCoinWaitlist()).toBe(false);
    });

    it('should return false if the user has no waitlist participation events', () => {
      const user = new UserEntity();
      user.wildrcoinData = {
        waitlistParticipationEvents: [],
      };
      expect(user.isOnWildrCoinWaitlist()).toBe(false);
    });

    it('should return false if the most recent event is not a join event', () => {
      const user = new UserEntity();
      user.wildrcoinData = {
        waitlistParticipationEvents: [
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: new Date().toISOString(),
          },
          {
            // @ts-ignore
            __typename: 'WildrcoinWaitlistLeaveEvent',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      expect(user.isOnWildrCoinWaitlist()).toBe(false);
    });

    it('should return true if the most recent event is a join event', () => {
      const user = new UserEntity();
      user.wildrcoinData = {
        waitlistParticipationEvents: [
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: new Date().toISOString(),
          },
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      expect(user.isOnWildrCoinWaitlist()).toBe(true);
    });
  });

  describe('completeBanner', () => {
    it('should mark a banner as completed', async () => {
      const user = new UserEntity();
      const before = new Date();
      await wait(2);
      user.completeBanner({ bannerId: 'banner-id' });
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          ['banner-id']: {
            skipCount: 0,
            lastSkippedAt: expect.any(String),
            completedAt: expect.any(String),
          },
        },
      };
      expect(user.bannerData).toEqual(expectedBannerData);
      const lastSkippedAt =
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt;
      const lastSkippedAtTime = lastSkippedAt
        ? new Date(lastSkippedAt).getTime()
        : 0;
      expect(lastSkippedAtTime).toBeGreaterThan(before.getTime());
      const completedAt =
        user.bannerData?.bannerInteractions['banner-id'].completedAt;
      const completedAtTime = completedAt ? new Date(completedAt).getTime() : 0;
      expect(completedAtTime).toBeGreaterThan(before.getTime());
    });

    it('should not overwrite other banner interactions', async () => {
      const user = new UserEntity();
      user.bannerData = {
        bannerInteractions: {
          ['other-banner-id']: {
            skipCount: 1,
            lastSkippedAt: new Date().toISOString(),
          },
        },
      };
      const before = new Date();
      await wait(2);
      user.completeBanner({ bannerId: 'banner-id' });
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          ['other-banner-id']: {
            skipCount: 1,
            lastSkippedAt: expect.any(String),
          },
          ['banner-id']: {
            skipCount: 0,
            lastSkippedAt: expect.any(String),
            completedAt: expect.any(String),
          },
        },
      };
      expect(user.bannerData).toEqual(expectedBannerData);
      const lastSkippedAt =
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt;
      const lastSkippedAtTime = lastSkippedAt
        ? new Date(lastSkippedAt).getTime()
        : 0;
      expect(lastSkippedAtTime).toBeGreaterThan(before.getTime());
      const completedAt =
        user.bannerData?.bannerInteractions['banner-id'].completedAt;
      const completedAtTime = completedAt ? new Date(completedAt).getTime() : 0;
      expect(completedAtTime).toBeGreaterThan(before.getTime());
    });

    it('should not overwrite a banner skip', async () => {
      const user = new UserEntity();
      const skippedAt = new Date().toISOString();
      user.bannerData = {
        bannerInteractions: {
          ['banner-id']: {
            skipCount: 1,
            lastSkippedAt: skippedAt,
          },
        },
      };
      const before = new Date();
      await wait(2);
      user.completeBanner({ bannerId: 'banner-id' });
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          ['banner-id']: {
            skipCount: 1,
            lastSkippedAt: skippedAt,
            completedAt: expect.any(String),
          },
        },
      };
      expect(user.bannerData).toEqual(expectedBannerData);
      const lastSkippedAt =
        user.bannerData?.bannerInteractions['banner-id'].lastSkippedAt;
      const lastSkippedAtTime = lastSkippedAt
        ? new Date(lastSkippedAt).getTime()
        : 0;
      expect(lastSkippedAtTime).toBe(before.getTime());
      const completedAt =
        user.bannerData?.bannerInteractions['banner-id'].completedAt;
      const completedAtTime = completedAt ? new Date(completedAt).getTime() : 0;
      expect(completedAtTime).toBeGreaterThan(before.getTime());
    });
  });

  describe(UserEntity.prototype.joinWildrCoinWaitlist.name, () => {
    it('should add a waitlist participation event', () => {
      const user = new UserEntity();
      user.wildrcoinData = {};
      user.joinWildrCoinWaitlist();
      expect(user.wildrcoinData.waitlistParticipationEvents).toEqual([
        {
          __typename: 'WildrcoinWaitlistJoinEvent',
          createdAt: expect.any(String),
        },
      ]);
    });

    it('should return an error if the user has already joined the waitlist', () => {
      const user = new UserEntity();
      user.wildrcoinData = {
        waitlistParticipationEvents: [
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      const result = user.joinWildrCoinWaitlist();
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AlreadyJoinedWildrcoinWaitlistException
      );
      expect(user.wildrcoinData.waitlistParticipationEvents).toEqual([
        {
          __typename: 'WildrcoinWaitlistJoinEvent',
          createdAt: expect.any(String),
        },
      ]);
    });

    it('should mark wildr coin waitlist banners as completed', () => {
      const user = new UserEntity();
      user.wildrcoinData = {};
      user.completeBanner({ bannerId: 'banner-id' });
      user.joinWildrCoinWaitlist();
      expect(
        // banner-id defined in test env vars
        user.bannerData?.bannerInteractions['banner-id'].completedAt
      ).toBeDefined();
    });
  });

  describe(UserEntity.prototype.addLinkData.name, () => {
    it('should add signup data to user', () => {
      const user = new UserEntity();
      const signupData = {
        linkId: 'link-id',
        refererId: 'referer-id',
        pseudoUserId: 'pseudo-user-id',
        sourceId: 'source-id',
        sourceType: LinkSourceType.USER,
        otherParams: [
          {
            key: 'key',
            value: 'value',
          },
        ],
      };
      user.addLinkData(signupData);
      expect(user.signupData).toEqual({
        linkId: 'link-id',
        refererId: 'referer-id',
        pseudoUserId: 'pseudo-user-id',
        sourceId: 'source-id',
        sourceType: 0,
        otherParams: {
          key: 'value',
        },
      });
    });
  });
});
