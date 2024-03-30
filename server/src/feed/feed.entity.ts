export interface FeedCursorUp {
  type: 'FeedCursorUp';
  last: number;
  before: string;
}

export interface FeedCursorDown {
  type: 'FeedCursorDown';
  first: number;
  after: string;
}

export type FeedCursor = FeedCursorUp | FeedCursorDown;

export const toCursor = (
  first?: number,
  after?: string,
  last?: number,
  before?: string
): FeedCursor => {
  if (last) {
    return <FeedCursorUp>{
      type: 'FeedCursorUp',
      last: last ?? 3,
      before: before,
    };
  }
  if (before && first) {
    return <FeedCursorUp>{
      type: 'FeedCursorUp',
      last: first,
      before: before,
    };
  }
  return <FeedCursorDown>{
    type: 'FeedCursorDown',
    first: first ?? 3,
    after: after,
  };
};

export enum FeedEntityType {
  //--------------------------------
  //0 - 299 are reserved for Posts and Stories Feed
  //Global
  GLOBAL_ALL_POSTS = 7, //Backward-Compatible
  GLOBAL_TEXT_POSTS = 14, //Backward-Compatible
  GLOBAL_IMAGE_POSTS = 15, //Backward-Compatible
  GLOBAL_VIDEO_POSTS = 16, //Backward-Compatible
  GLOBAL_COLLAGE_POST = 17, //Backward-Compatible
  FOLLOWING_USERS_ALL_POSTS = 18, //Backward-Compatible
  FOLLOWING_USERS_TEXT_POSTS = 19, //Backward-Compatible
  FOLLOWING_USERS_IMAGE_POSTS = 20, //Backward-Compatible
  FOLLOWING_USERS_VIDEO_POSTS = 21, //Backward-Compatible
  FOLLOWING_USERS_COLLAGE_POSTS = 22, //Backward-Compatible

  //User Specific
  //----------------CONTAINS GLOBAL AND FOLLOWING POSTS
  PERSONALIZED_ALL_POSTS = 51,
  PERSONALIZED_TEXT_POSTS = 52,
  PERSONALIZED_IMAGE_POSTS = 53,
  PERSONALIZED_VIDEO_POSTS = 54,
  PERSONALIZED_COLLAGE_POSTS = 55,

  RELEVANT_ALL_POSTS = 61,
  RELEVANT_TEXT_POSTS = 62,
  RELEVANT_IMAGE_POSTS = 63,
  RELEVANT_VIDEO_POSTS = 64,
  RELEVANT_COLLAGE_POSTS = 65,

  ICYM_ALL_POSTS = 71,
  ICYM_TEXT_POSTS = 72,
  ICYM_IMAGE_POSTS = 73,
  ICYM_VIDEO_POSTS = 74,
  ICYM_COLLAGE_POSTS = 75,

  REMAINING_ALL_POSTS = 81,
  REMAINING_TEXT_POSTS = 82,
  REMAINING_IMAGE_POSTS = 83,
  REMAINING_VIDEO_POSTS = 84,
  REMAINING_COLLAGE_POSTS = 85,

  //----------------CONTAINS FOLLOWINGS ONLY POSTS
  PERSONALIZED_FOLLOWING_USERS_ALL_POSTS = 91,
  PERSONALIZED_FOLLOWING_USERS_TEXT_POSTS = 92,
  PERSONALIZED_FOLLOWING_USERS_IMAGE_POSTS = 93,
  PERSONALIZED_FOLLOWING_USERS_VIDEO_POSTS = 94,
  PERSONALIZED_FOLLOWING_USERS_COLLAGE_POSTS = 95,

  RELEVANT_FOLLOWING_USERS_ALL_POSTS = 101,
  RELEVANT_FOLLOWING_USERS_TEXT_POSTS = 102,
  RELEVANT_FOLLOWING_USERS_IMAGE_POSTS = 103,
  RELEVANT_FOLLOWING_USERS_VIDEO_POSTS = 104,
  RELEVANT_FOLLOWING_USERS_COLLAGE_POSTS = 105,

  //It's possible that you are not following those accounts but those
  // accounts are your favorites?
  ICYM_FOLLOWING_USERS_ALL_POSTS = 111,
  ICYM_FOLLOWING_USERS_TEXT_POSTS = 112,
  ICYM_FOLLOWING_USERS_IMAGE_POSTS = 113,
  ICYM_FOLLOWING_USERS_VIDEO_POSTS = 114,
  ICYM_FOLLOWING_USERS_COLLAGE_POSTS = 115,

  REMAINING_FOLLOWING_USERS_ALL_POSTS = 121,
  REMAINING_FOLLOWING_USERS_TEXT_POSTS = 122,
  REMAINING_FOLLOWING_USERS_IMAGE_POSTS = 123,
  REMAINING_FOLLOWING_USERS_VIDEO_POSTS = 124,
  REMAINING_FOLLOWING_USERS_COLLAGE_POSTS = 125,

  //User Profile Posts
  //----------------User Posts that Visible to other users
  USER_PROFILE_PUB_ALL_POSTS = 131,
  USER_PROFILE_PUB_TEXT_POSTS = 132,
  USER_PROFILE_PUB_IMAGE_POSTS = 133,
  USER_PROFILE_PUB_VIDEO_POSTS = 134,
  USER_PROFILE_PUB_COLLAGE_POSTS = 135,

  USER_PROFILE_PVT_PUB_ALL_POSTS = 141,
  USER_PROFILE_PVT_PUB_TEXT_POSTS = 142,
  USER_PROFILE_PVT_PUB_IMAGE_POSTS = 143,
  USER_PROFILE_PVT_PUB_VIDEO_POSTS = 144,
  USER_PROFILE_PVT_PUB_COLLAGE_POSTS = 145,

  //---------------User Profile Stories
  USER_PROFILE_PUB_ALL_STORIES = 151,
  USER_PROFILE_PUB_TEXT_STORIES = 152,
  USER_PROFILE_PUB_IMAGE_STORIES = 153,
  USER_PROFILE_PUB_VIDEO_STORIES = 154,
  USER_PROFILE_PUB_COLLAGE_STORIES = 155,

  USER_PROFILE_PVT_PUB_ALL_STORIES = 161,
  USER_PROFILE_PVT_PUB_TEXT_STORIES = 162,
  USER_PROFILE_PVT_PUB_IMAGE_STORIES = 163,
  USER_PROFILE_PVT_PUB_VIDEO_STORIES = 164,
  USER_PROFILE_PVT_PUB_COLLAGE_STORIES = 165,

  // Consumed
  CONSUMED_ALL_POSTS = 171,
  CONSUMED_TEXT_POSTS = 172,
  CONSUMED_IMAGE_POSTS = 173,
  CONSUMED_VIDEO_POSTS = 174,
  CONSUMED_COLLAGE_POSTS = 175,

  //USER LIST
  //By Creator of the List
  USER_LIST_CREATOR_ALL_POSTS = 201,
  USER_LIST_CREATOR_TEXT_POSTS = 202,
  USER_LIST_CREATOR_IMAGE_POSTS = 203,
  USER_LIST_CREATOR_VIDEO_POSTS = 204,
  USER_LIST_CREATOR_COLLAGE_POSTS = 205,

  //Posts shared by members in this list
  USER_LIST_CONSUMPTION_ALL_POSTS = 221,
  USER_LIST_CONSUMPTION_TEXT_POSTS = 222,
  USER_LIST_CONSUMPTION_IMAGE_POSTS = 223,
  USER_LIST_CONSUMPTION_VIDEO_POSTS = 224,
  USER_LIST_CONSUMPTION_COLLAGE_POSTS = 225,

  // ----------------- Annotation pending
  UNANNOTATED_POSTS = 295,
  ANNOTATED_UNDISTRIBUTED_POSTS = 296,
  ANNOTATED_DISTRIBUTION_IN_PROGRESS_POSTS = 297,

  //-------------------
  // Comments and Replies related 300 - 319
  COMMENT = 300,
  LIKED_COMMENTS = 301,
  REPLY = 302,
  LIKED_REPLIES = 303,

  //-------------------
  // Followers Following 320 - 329
  FOLLOWING = 320,
  FOLLOWER = 321,

  //-------------------
  // REPORT 330-339
  REPORT_COMMENTS = 330,
  REPORT_REPLIES = 331,
  REPORT_POSTS = 332,
  REPORT_CHALLENGES = 333,

  //------------------
  // POST REACTIONS 340 - 341
  REAL_REACTIONS_ON_POST = 340,
  APPLAUD_REACTIONS_ON_POST = 341,
  LIKE_REACTIONS_ON_POST = 342,

  //------------------
  // POST OTHER
  BLOCKED_COMMENTERS_ON_POST = 351,
  FLAGGED_COMMENTS_ON_POST = 352,

  BLOCKED_COMMENTERS_ON_CHALLENGE = 451,
  FLAGGED_COMMENTS_ON_CHALLENGE = 452,

  USER_CATEGORY_INTERESTS = 401,
  USER_PREDICTED_CATEGORY_INTERESTS = 402,
  USER_POST_TYPE_INTERESTS = 403,
  USER_PREDICTED_POST_TYPE_INTERESTS = 404,

  USER_CATEGORY_INTERACTION = 411,
  USER_CATEGORY_VIEWS = 412,
  USER_POST_TYPE_INTERACTION = 413,
  USER_POST_TYPE_VIEWS = 414,

  USER_FRIENDS_AND_FAMILY_USERS = 421,
  USER_FAVORITE_USERS = 422,
  USER_INTERACTIONS_SCORE = 423,

  // COMMENT REACTIONS
  LIKE_REACTIONS_ON_COMMENT = 431,

  // REPLY REACTIONS
  LIKE_REACTIONS_ON_REPLY = 451,

  BLOCK_LIST = 501,
  BLOCKED_BY_USERS_LIST = 502,

  //REPOST
  REPOSTED_POSTS = 511,
  REPOST_AUTHORS = 512,

  //USER_LIST
  //Storing all the Lists created by a user
  USER_CREATED_LISTS = 520,

  INNER_CIRCLE_SUGGESTIONS_LIST = 530,

  //CHALLENGES

  //Storing Challenges
  GLOBAL_ALL_CHALLENGES = 1001,
  GLOBAL_ACTIVE_CHALLENGES = 1002,
  GLOBAL_PAST_CHALLENGES = 1003,
  GLOBAL_FEATURED_CHALLENGES = 1004,

  //Creator and Participants (1010 - 1019)
  USER_JOINED_CHALLENGES = 1010,
  USER_CREATED_CHALLENGES = 1011,

  //Entries of a Challenge (1020-1029)
  CHALLENGE_ALL_POST_ENTRIES = 1020,
  CHALLENGE_PINNED_ENTRIES = 1021,
  CHALLENGE_FEATURED_ENTRIES = 1022,
  CHALLENGE_USER_SPECIFIC_FEATURED_ENTRIES = 1023,

  //Entries by a user per challenge
  USER_CHALLENGE_POST_ENTRIES = 1024, //1024:user_id#challenge_id
  CHALLENGE_AUTHOR_INTERACTIONS = 1025, //1025:challenge_id#author_id

  //Participants of a Challenge(1030-1039)
  CHALLENGE_PARTICIPANTS = 1030,
  CHALLENGE_LEADERBOARD = 1031,

  // Invite records
  REFERRED_USERS = 1040, // 1040:user_id

  //DEPRECATED

  USER_PUB_POSTS = 1,
  USER_PUB_PVT_POSTS = 8,
  USER_PUB_STORIES = 33,
  USER_PUB_PVT_STORIES = 34,
}

export const ListPostsForDistribution = [
  FeedEntityType.USER_LIST_CREATOR_ALL_POSTS,
  FeedEntityType.USER_LIST_CREATOR_TEXT_POSTS,
  FeedEntityType.USER_LIST_CREATOR_IMAGE_POSTS,
  FeedEntityType.USER_LIST_CREATOR_VIDEO_POSTS,
  FeedEntityType.USER_LIST_CREATOR_COLLAGE_POSTS,
];

export const ListPostsForDistributionBasedOnPostTypes = [
  FeedEntityType.USER_LIST_CREATOR_ALL_POSTS,
  -1, //Audio
  FeedEntityType.USER_LIST_CREATOR_TEXT_POSTS,
  FeedEntityType.USER_LIST_CREATOR_IMAGE_POSTS,
  FeedEntityType.USER_LIST_CREATOR_VIDEO_POSTS,
  FeedEntityType.USER_LIST_CREATOR_COLLAGE_POSTS,
];

export const ListPostsConsumption = [
  FeedEntityType.USER_LIST_CONSUMPTION_ALL_POSTS,
  FeedEntityType.USER_LIST_CONSUMPTION_TEXT_POSTS,
  FeedEntityType.USER_LIST_CONSUMPTION_IMAGE_POSTS,
  FeedEntityType.USER_LIST_CONSUMPTION_VIDEO_POSTS,
  FeedEntityType.USER_LIST_CONSUMPTION_COLLAGE_POSTS,
];

export const ListPostsForConsumptionBasedOnPostTypes = [
  FeedEntityType.USER_LIST_CONSUMPTION_ALL_POSTS,
  -1,
  FeedEntityType.USER_LIST_CONSUMPTION_TEXT_POSTS,
  FeedEntityType.USER_LIST_CONSUMPTION_IMAGE_POSTS,
  FeedEntityType.USER_LIST_CONSUMPTION_VIDEO_POSTS,
  FeedEntityType.USER_LIST_CONSUMPTION_COLLAGE_POSTS,
];

//Match it with PostTypes
export const FollowingUserPostsSubFeedTypes = [
  FeedEntityType.FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.FOLLOWING_USERS_COLLAGE_POSTS,
];

export const FollowingUserPostsFeedTypes = [
  FeedEntityType.FOLLOWING_USERS_ALL_POSTS,
  ...FollowingUserPostsSubFeedTypes,
];

export const FollowingUserPostsFeedBasedOnPostTypes = [
  FeedEntityType.FOLLOWING_USERS_ALL_POSTS,
  -1, //Audio
  FeedEntityType.FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.FOLLOWING_USERS_COLLAGE_POSTS,
];

export const PersonalizedPostsFeedBasedOnPostTypes = [
  FeedEntityType.PERSONALIZED_ALL_POSTS,
  -1, //Audio
  FeedEntityType.PERSONALIZED_IMAGE_POSTS,
  FeedEntityType.PERSONALIZED_TEXT_POSTS,
  FeedEntityType.PERSONALIZED_VIDEO_POSTS,
  FeedEntityType.PERSONALIZED_COLLAGE_POSTS,
];

export const PersonalizedPostsFollowingFeedBasedOnPostTypes = [
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_ALL_POSTS,
  -1, //Audio
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_COLLAGE_POSTS,
];

export const GlobalPostsFeedTypesBasedOnPostTypes = [
  FeedEntityType.GLOBAL_ALL_POSTS,
  -1,
  FeedEntityType.GLOBAL_IMAGE_POSTS,
  FeedEntityType.GLOBAL_TEXT_POSTS,
  FeedEntityType.GLOBAL_VIDEO_POSTS,
  FeedEntityType.GLOBAL_COLLAGE_POST,
];

export const UserProfilePubStoriesBasedOnPostTypes = [
  FeedEntityType.USER_PROFILE_PUB_ALL_STORIES,
  -1,
  FeedEntityType.USER_PROFILE_PUB_IMAGE_STORIES,
  FeedEntityType.USER_PROFILE_PUB_TEXT_STORIES,
  FeedEntityType.USER_PROFILE_PUB_VIDEO_STORIES,
  FeedEntityType.USER_PROFILE_PUB_COLLAGE_STORIES,
];

export const UserProfilePrivatePubStoriesBasedOnPostTypes = [
  FeedEntityType.USER_PROFILE_PVT_PUB_ALL_STORIES,
  -1,
  FeedEntityType.USER_PROFILE_PVT_PUB_IMAGE_STORIES,
  FeedEntityType.USER_PROFILE_PVT_PUB_TEXT_STORIES,
  FeedEntityType.USER_PROFILE_PVT_PUB_VIDEO_STORIES,
  FeedEntityType.USER_PROFILE_PVT_PUB_COLLAGE_STORIES,
];

export const UserProfilePubPostsBasedOnPostTypes = [
  FeedEntityType.USER_PROFILE_PUB_ALL_POSTS, //0
  -1, //Audio
  FeedEntityType.USER_PROFILE_PUB_IMAGE_POSTS, //2
  FeedEntityType.USER_PROFILE_PUB_TEXT_POSTS, //3
  FeedEntityType.USER_PROFILE_PUB_VIDEO_POSTS, //4
  FeedEntityType.USER_PROFILE_PUB_COLLAGE_POSTS, //5
];

export const UserProfilePrivatePubPostsBasedOnPostTypes = [
  FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, // -
  -1, //Audio
  FeedEntityType.USER_PROFILE_PVT_PUB_IMAGE_POSTS, //2
  FeedEntityType.USER_PROFILE_PVT_PUB_TEXT_POSTS, //3
  FeedEntityType.USER_PROFILE_PVT_PUB_VIDEO_POSTS, //4
  FeedEntityType.USER_PROFILE_PVT_PUB_COLLAGE_POSTS, //5
];

export const RelevantPostsFeedEnumsBasedOnPostTypes = [
  FeedEntityType.RELEVANT_ALL_POSTS,
  -1,
  FeedEntityType.RELEVANT_IMAGE_POSTS,
  FeedEntityType.RELEVANT_TEXT_POSTS,
  FeedEntityType.RELEVANT_VIDEO_POSTS,
  FeedEntityType.RELEVANT_COLLAGE_POSTS,
];

export const ICYMPostsFeedEnumsBasedOnPostTypes = [
  FeedEntityType.ICYM_ALL_POSTS,
  -1,
  FeedEntityType.ICYM_IMAGE_POSTS,
  FeedEntityType.ICYM_TEXT_POSTS,
  FeedEntityType.ICYM_VIDEO_POSTS,
  FeedEntityType.ICYM_COLLAGE_POSTS,
];

export const RemainingPostsFeedEnumsBasedOnPostTypes = [
  FeedEntityType.REMAINING_ALL_POSTS,
  -1,
  FeedEntityType.REMAINING_IMAGE_POSTS,
  FeedEntityType.REMAINING_TEXT_POSTS,
  FeedEntityType.REMAINING_VIDEO_POSTS,
  FeedEntityType.REMAINING_COLLAGE_POSTS,
];

export const RelevantFollowingPostsFeedEnumsBasedOnPostTypes = [
  FeedEntityType.RELEVANT_FOLLOWING_USERS_ALL_POSTS,
  -1,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_COLLAGE_POSTS,
];

export const ICYMFollowingPostsFeedEnumsBasedOnPostTypes = [
  FeedEntityType.ICYM_FOLLOWING_USERS_ALL_POSTS,
  -1,
  FeedEntityType.ICYM_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.ICYM_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.ICYM_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.ICYM_FOLLOWING_USERS_COLLAGE_POSTS,
];

export const RemainingFollowingPostsFeedEnumsBasedOnPostTypes = [
  FeedEntityType.REMAINING_FOLLOWING_USERS_ALL_POSTS,
  -1,
  FeedEntityType.REMAINING_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.REMAINING_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.REMAINING_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.REMAINING_FOLLOWING_USERS_COLLAGE_POSTS,
];

//##########

export const ConsumedPostsFeedEnums: ConsumedPostsFeedTypes[] = [
  FeedEntityType.CONSUMED_ALL_POSTS,
  FeedEntityType.CONSUMED_TEXT_POSTS,
  FeedEntityType.CONSUMED_IMAGE_POSTS,
  FeedEntityType.CONSUMED_VIDEO_POSTS,
  FeedEntityType.CONSUMED_COLLAGE_POSTS,
];

export type ConsumedPostsFeedTypes =
  | FeedEntityType.CONSUMED_ALL_POSTS
  | FeedEntityType.CONSUMED_TEXT_POSTS
  | FeedEntityType.CONSUMED_IMAGE_POSTS
  | FeedEntityType.CONSUMED_VIDEO_POSTS
  | FeedEntityType.CONSUMED_COLLAGE_POSTS;

export const InterestedAccountsFeedEnums = [
  FeedEntityType.USER_FRIENDS_AND_FAMILY_USERS,
  FeedEntityType.USER_FAVORITE_USERS,
  FeedEntityType.USER_INTERACTIONS_SCORE,
];

export const UserInterestsFeedEnums = [
  FeedEntityType.USER_CATEGORY_INTERESTS,
  FeedEntityType.USER_PREDICTED_CATEGORY_INTERESTS,
  FeedEntityType.USER_POST_TYPE_INTERESTS,
  FeedEntityType.USER_PREDICTED_POST_TYPE_INTERESTS,
  FeedEntityType.USER_CATEGORY_INTERACTION,
  FeedEntityType.USER_CATEGORY_VIEWS,
  FeedEntityType.USER_POST_TYPE_INTERACTION,
  FeedEntityType.USER_POST_TYPE_VIEWS,
];

export type PersonalizedSubFeedTypes =
  | FeedEntityType.PERSONALIZED_ALL_POSTS
  | FeedEntityType.PERSONALIZED_TEXT_POSTS
  | FeedEntityType.PERSONALIZED_IMAGE_POSTS
  | FeedEntityType.PERSONALIZED_VIDEO_POSTS
  | FeedEntityType.PERSONALIZED_COLLAGE_POSTS;

export const PersonalizedSubFeedEnums: PersonalizedSubFeedTypes[] = [
  FeedEntityType.PERSONALIZED_TEXT_POSTS,
  FeedEntityType.PERSONALIZED_IMAGE_POSTS,
  FeedEntityType.PERSONALIZED_VIDEO_POSTS,
  FeedEntityType.PERSONALIZED_COLLAGE_POSTS,
];

export const PersonalizedFeedEnums: PersonalizedSubFeedTypes[] = [
  FeedEntityType.PERSONALIZED_ALL_POSTS,
  ...PersonalizedSubFeedEnums,
];

export type RelevantPostsFeedTypes =
  | FeedEntityType.RELEVANT_ALL_POSTS
  | FeedEntityType.RELEVANT_TEXT_POSTS
  | FeedEntityType.RELEVANT_IMAGE_POSTS
  | FeedEntityType.RELEVANT_VIDEO_POSTS
  | FeedEntityType.RELEVANT_COLLAGE_POSTS;

export const RelevantPostsFeedEnums: RelevantPostsFeedTypes[] = [
  FeedEntityType.RELEVANT_ALL_POSTS,
  FeedEntityType.RELEVANT_TEXT_POSTS,
  FeedEntityType.RELEVANT_IMAGE_POSTS,
  FeedEntityType.RELEVANT_VIDEO_POSTS,
  FeedEntityType.RELEVANT_COLLAGE_POSTS,
];

export const getRelevantPostFeedEnumFromPersonalizedFeedEnum = (
  personalizedSubFeedEnum: PersonalizedSubFeedTypes
): RelevantPostsFeedTypes => {
  switch (personalizedSubFeedEnum) {
    case FeedEntityType.PERSONALIZED_TEXT_POSTS:
      return FeedEntityType.RELEVANT_TEXT_POSTS;
    case FeedEntityType.PERSONALIZED_IMAGE_POSTS:
      return FeedEntityType.RELEVANT_IMAGE_POSTS;
    case FeedEntityType.PERSONALIZED_VIDEO_POSTS:
      return FeedEntityType.RELEVANT_VIDEO_POSTS;
    case FeedEntityType.PERSONALIZED_COLLAGE_POSTS:
      return FeedEntityType.RELEVANT_COLLAGE_POSTS;
    case FeedEntityType.PERSONALIZED_ALL_POSTS:
      return FeedEntityType.RELEVANT_ALL_POSTS;
  }
};

export const ICYMPostsFeedEnums = [
  FeedEntityType.ICYM_ALL_POSTS,
  FeedEntityType.ICYM_TEXT_POSTS,
  FeedEntityType.ICYM_IMAGE_POSTS,
  FeedEntityType.ICYM_VIDEO_POSTS,
  FeedEntityType.ICYM_COLLAGE_POSTS,
];

export const RemainingPostsFeedEnums = [
  FeedEntityType.REMAINING_ALL_POSTS,
  FeedEntityType.REMAINING_TEXT_POSTS,
  FeedEntityType.REMAINING_IMAGE_POSTS,
  FeedEntityType.REMAINING_VIDEO_POSTS,
  FeedEntityType.REMAINING_COLLAGE_POSTS,
];

//Subset of the main feed, filtered by authors whom user is Following
export const PersonalizedFollowingFeedEnums = [
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_ALL_POSTS,
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.PERSONALIZED_FOLLOWING_USERS_COLLAGE_POSTS,
];

export const RelevantFollowingPostsFeedEnums = [
  FeedEntityType.RELEVANT_FOLLOWING_USERS_ALL_POSTS,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.RELEVANT_FOLLOWING_USERS_COLLAGE_POSTS,
];

export const ICYMFollowingPostsFeedEnums = [
  FeedEntityType.ICYM_FOLLOWING_USERS_ALL_POSTS,
  FeedEntityType.ICYM_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.ICYM_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.ICYM_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.ICYM_FOLLOWING_USERS_COLLAGE_POSTS,
];

export const RemainingFollowingPostsFeedEnums = [
  FeedEntityType.REMAINING_FOLLOWING_USERS_ALL_POSTS,
  FeedEntityType.REMAINING_FOLLOWING_USERS_TEXT_POSTS,
  FeedEntityType.REMAINING_FOLLOWING_USERS_IMAGE_POSTS,
  FeedEntityType.REMAINING_FOLLOWING_USERS_VIDEO_POSTS,
  FeedEntityType.REMAINING_FOLLOWING_USERS_COLLAGE_POSTS,
];

//Posts on Profile Page
export const UserPubPostsFeedEnums = [
  FeedEntityType.USER_PROFILE_PUB_ALL_POSTS,
  FeedEntityType.USER_PROFILE_PUB_TEXT_POSTS,
  FeedEntityType.USER_PROFILE_PUB_IMAGE_POSTS,
  FeedEntityType.USER_PROFILE_PUB_VIDEO_POSTS,
  FeedEntityType.USER_PROFILE_PUB_COLLAGE_POSTS,
];

export const UserPubPvtPostsFeedEnums = [
  FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS,
  FeedEntityType.USER_PROFILE_PVT_PUB_TEXT_POSTS,
  FeedEntityType.USER_PROFILE_PVT_PUB_IMAGE_POSTS,
  FeedEntityType.USER_PROFILE_PVT_PUB_VIDEO_POSTS,
  FeedEntityType.USER_PROFILE_PVT_PUB_COLLAGE_POSTS,
];

//Stories
export const UserPubStoriesFeedEnums = [
  FeedEntityType.USER_PROFILE_PUB_ALL_STORIES,
  FeedEntityType.USER_PROFILE_PUB_TEXT_STORIES,
  FeedEntityType.USER_PROFILE_PUB_IMAGE_STORIES,
  FeedEntityType.USER_PROFILE_PUB_VIDEO_STORIES,
  FeedEntityType.USER_PROFILE_PUB_COLLAGE_STORIES,
];

export const UserPubPvtStoriesFeedEnums = [
  FeedEntityType.USER_PROFILE_PVT_PUB_ALL_STORIES,
  FeedEntityType.USER_PROFILE_PVT_PUB_TEXT_STORIES,
  FeedEntityType.USER_PROFILE_PVT_PUB_IMAGE_STORIES,
  FeedEntityType.USER_PROFILE_PVT_PUB_VIDEO_STORIES,
  FeedEntityType.USER_PROFILE_PVT_PUB_COLLAGE_STORIES,
];

export const FeedsForBuildingUserPersonalizedFeed = [
  ...PersonalizedFeedEnums,
  // ...PersonalizedFollowingFeedEnums,
  ...RelevantPostsFeedEnums,
  // ...RelevantFollowingPostsFeedEnums,
  // ...ICYMPostsFeedEnums,
  // ...ICYMFollowingPostsFeedEnums,
  // ...RemainingPostsFeedEnums,
  // ...RemainingFollowingPostsFeedEnums,
];

export interface IdWithScore {
  idsMap: { [k: string]: number };
}

export interface FeedPage {
  ids: string[];
  idsWithScore: IdWithScore;
  lastSeenCursor?: string;
  order?: FeedPageOrder;
}

type FeedProperties = {
  [Key in keyof Required<FeedEntity>]: Key;
};

export class FeedEntity {
  id: string;
  _count: number;
  pageNumber: number;
  createdAt: Date;
  updatedAt: Date;
  page: FeedPage;

  static readonly kFields: FeedProperties = {
    id: 'id',
    _count: '_count',
    pageNumber: 'pageNumber',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    page: 'page',
    // Methods
    ids: 'ids',
    count: 'count',
    tryAddEntries: 'tryAddEntries',
    tryUnshiftEntry: 'tryUnshiftEntry',
    tryRemoveEntry: 'tryRemoveEntry',
    hasEntry: 'hasEntry',
    unshiftToFeedSet: 'unshiftToFeedSet',
  };

  constructor() {
    this.id = '';
    this._count = 0;
    this.pageNumber = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.page = { ids: [], idsWithScore: { idsMap: {} } };
  }

  get ids(): string[] {
    return this.page.ids;
  }

  set ids(ids: string[]) {
    this.page.ids = ids;
  }

  get count(): number {
    return !this._count ? 0 : this._count;
  }

  set count(value: number) {
    this._count = value;
  }

  tryAddEntries(entryIds: string[]) {
    this._count += entryIds.length;
    this.page.ids.push(...entryIds);
  }

  tryUnshiftEntry(entryId: string, shouldSkipHasEntry = false) {
    if (shouldSkipHasEntry) {
      this._count += 1;
      this.page.ids.unshift(entryId);
    } else if (!this.hasEntry(entryId)) {
      this._count += 1;
      this.page.ids.unshift(entryId);
    }
  }

  tryRemoveEntry(entryId: string) {
    if (this.hasEntry(entryId)) {
      this.count = Math.max(this._count - 1, 0);
      this.page.ids = this.page.ids.filter(id => id !== entryId);
    }
  }

  hasEntry(entryId: string): boolean {
    return this.page.ids.includes(entryId);
  }

  unshiftToFeedSet(entryId: string): { added: boolean } {
    let added = false;
    const ids = new Set(this.page.ids);
    const newIds = Array.from(ids);
    if (!ids.has(entryId)) {
      newIds.unshift(entryId);
      added = true;
    }
    this.page.ids = newIds;
    this._count = newIds.length;
    return { added };
  }
}

export const kvpToMap = (jsonb: { [k: string]: number }): Map<string, number> =>
  new Map(Object.entries(jsonb));
export const mapToKVP = (map: Map<string, number>) => Object.fromEntries(map);

export enum FeedPageOrder {
  OLDEST_FIRST = 1,
  LATEST_FIRST = 2,
}

export const isFeedType = ({
  type,
  feed,
}: {
  type: FeedEntityType;
  feed: FeedEntity;
}) => {
  return feed.id.startsWith(type.toString());
};
