import { ActivityData, ActivityItemData } from '../activity-common';
import { faker } from '@faker-js/faker';

export const activityItemDataFake = (
  overrides?: Partial<ActivityItemData>
): ActivityItemData => {
  return {
    type: 'ActivityItemData',
    isAggregated: faker.datatype.boolean(),
    ids: [],
    ...overrides,
  };
};

export const activityDataFake = (
  overrides?: Partial<ActivityData>
): ActivityData => {
  return {
    type: 'ActivityData',
    reactionLikeAD: activityItemDataFake(),
    reactionApplauseAD: activityItemDataFake(),
    reactionRealAD: activityItemDataFake(),
    commentAD: activityItemDataFake(),
    replyAD: activityItemDataFake(),
    followedAD: activityItemDataFake(),
    addedToInnerCircleAD: activityItemDataFake(),
    ...overrides,
  };
};
