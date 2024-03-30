import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { userIndexVersionConfig } from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

describe('userIndexVersionConfig', () => {
  describe('serializeRecord', () => {
    it('should return a filtered user', async () => {
      const user = UserEntityFake();
      const repo = {
        findOneOrFail: jest.fn().mockResolvedValue(user),
      };
      const result = await userIndexVersionConfig.serializeRecord(
        user.id,
        repo as any
      );
      expect(result).toEqual({
        __typename: 'UserSnapshot',
        _stats: user.getStats(),
        id: user.id,
        activityData: user.activityData,
        avatarImage: user.avatarImage,
        bio: user.bio,
        commentEnabledAt: user.commentEnabledAt,
        commentOnboardedAt: user.commentOnboardedAt,
        createdAt: user.createdAt,
        email: user.email,
        fcmToken: user.fcmToken,
        firebaseUID: user.firebaseUID,
        gender: user.gender,
        handle: user.handle,
        localizationData: user.localizationData,
        name: user.name,
        onboardingStats: user.onboardingStats,
        phoneNumber: user.phoneNumber,
        pronoun: user.pronoun,
        updatedAt: user.updatedAt,
        userCategoryInterestsFeedId: toFeedId(
          FeedEntityType.USER_CATEGORY_INTERESTS,
          user.id
        ),
        userFollowerFeedId: toFeedId(FeedEntityType.FOLLOWER, user.id),
        userFollowingFeedId: toFeedId(FeedEntityType.FOLLOWING, user.id),
        userLikeReactionOnPostFeedId: toFeedId(
          FeedEntityType.LIKE_REACTIONS_ON_POST,
          user.id
        ),
        wildr_boost: 1,
      });
    });
  });
});
