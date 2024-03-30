export interface ActivityItemData {
  type: 'ActivityItemData';
  isAggregated: boolean;
  ids: string[];
}

export interface ActivityData {
  type: 'ActivityData';
  reactionLikeAD?: ActivityItemData;
  reactionApplauseAD?: ActivityItemData;
  reactionRealAD?: ActivityItemData;
  commentAD?: ActivityItemData;
  replyAD?: ActivityItemData;
  followedAD?: ActivityItemData;
  addedToInnerCircleAD?: ActivityItemData;
  addedToFollowingAD?: ActivityItemData;
  repostAD?: ActivityItemData;
  joinedAD?: ActivityItemData;
}
