/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  Time: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
  URL: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export type ActivitiesConnection = {
  __typename?: 'ActivitiesConnection';
  edges?: Maybe<Array<ActivitiesEdge>>;
  pageInfo: PageInfo;
};

export type ActivitiesEdge = {
  __typename?: 'ActivitiesEdge';
  cursor: Scalars['String']['output'];
  node: Activity;
};

export type Activity = Node & {
  __typename?: 'Activity';
  dataPayload?: Maybe<Scalars['String']['output']>;
  displayBodyStr?: Maybe<Scalars['String']['output']>;
  displayStr?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  miscObject?: Maybe<MiscObject>;
  object?: Maybe<ActivityObject>;
  objectType?: Maybe<ActivityObjectType>;
  subjects?: Maybe<Array<Maybe<User>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
  ts?: Maybe<Timestamps>;
  type?: Maybe<ActivityType>;
  verb?: Maybe<ActivityVerb>;
};

export type ActivityObject = Challenge | Comment | ImagePost | MultiMediaPost | Reply | TextPost | User | VideoPost;

export enum ActivityObjectType {
  Challenge = 'CHALLENGE',
  Comment = 'COMMENT',
  None = 'NONE',
  PostImage = 'POST_IMAGE',
  PostMultiMedia = 'POST_MULTI_MEDIA',
  PostText = 'POST_TEXT',
  PostVideo = 'POST_VIDEO',
  Reply = 'REPLY',
  User = 'USER'
}

export enum ActivityType {
  Aggregated = 'AGGREGATED',
  MetaEvent = 'META_EVENT',
  Single = 'SINGLE',
  System = 'SYSTEM',
  Unknown = 'UNKNOWN'
}

export enum ActivityVerb {
  AddedToIc = 'ADDED_TO_IC',
  AutoAddedToFollowing = 'AUTO_ADDED_TO_FOLLOWING',
  AutoAddedToIc = 'AUTO_ADDED_TO_IC',
  ChallengeCreated = 'CHALLENGE_CREATED',
  Commented = 'COMMENTED',
  CommentEmbargoLifted = 'COMMENT_EMBARGO_LIFTED',
  Followed = 'FOLLOWED',
  ImprovedProfileRing = 'IMPROVED_PROFILE_RING',
  JoinedChallenge = 'JOINED_CHALLENGE',
  MentionedInComment = 'MENTIONED_IN_COMMENT',
  MentionedInPost = 'MENTIONED_IN_POST',
  MentionedInReply = 'MENTIONED_IN_REPLY',
  Posted = 'POSTED',
  ReactionApplaud = 'REACTION_APPLAUD',
  ReactionLike = 'REACTION_LIKE',
  ReactionReal = 'REACTION_REAL',
  RecFinalStrike = 'REC_FINAL_STRIKE',
  RecFirstStrike = 'REC_FIRST_STRIKE',
  RecSecondStrike = 'REC_SECOND_STRIKE',
  Replied = 'REPLIED',
  Reposted = 'REPOSTED'
}

export type AddCommentInput = {
  challengeId?: InputMaybe<Scalars['ID']['input']>;
  content: ContentInput;
  negativeConfidenceCount?: InputMaybe<Scalars['Float']['input']>;
  participationType?: InputMaybe<ParticipationType>;
  postId?: InputMaybe<Scalars['ID']['input']>;
  shouldBypassTrollDetection?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AddCommentOutput = AddCommentResult | PostNotFoundError | SmartError | TrollDetectorError;

export type AddCommentResult = ChallengeInteractionResult & {
  __typename?: 'AddCommentResult';
  challenge?: Maybe<Challenge>;
  comment?: Maybe<Comment>;
  post?: Maybe<Post>;
};

export type AddEmailToWaitlistInput = {
  email: Scalars['String']['input'];
  waitlistType: WaitlistType;
};

export type AddEmailToWaitlistOutput = AddEmailToWaitlistResult | SmartError;

export type AddEmailToWaitlistResult = {
  __typename?: 'AddEmailToWaitlistResult';
  success: Scalars['Boolean']['output'];
};

export type AddMemberToInnerCircleInput = {
  memberId: Scalars['String']['input'];
};

export type AddMemberToListInput = {
  id: Scalars['String']['input'];
  memberId: Scalars['String']['input'];
};

export type AddReplyInput = {
  commentId: Scalars['ID']['input'];
  content: ContentInput;
  negativeConfidenceCount?: InputMaybe<Scalars['Float']['input']>;
  shouldBypassTrollDetection?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AddReplyOutput = AddReplyResult | SmartError | TrollDetectorError;

export type AddReplyResult = ChallengeInteractionResult & {
  __typename?: 'AddReplyResult';
  challenge?: Maybe<Challenge>;
  comment?: Maybe<Comment>;
  reply?: Maybe<Reply>;
};

export type AddUserToWaitlistInput = {
  waitlistType: WaitlistType;
};

export type AddUserToWaitlistOutput = AddUserToWaitlistResult | SmartError;

export type AddUserToWaitlistResult = {
  __typename?: 'AddUserToWaitlistResult';
  success: Scalars['Boolean']['output'];
};

export type AskForHandleAndNameError = Error & {
  __typename?: 'AskForHandleAndNameError';
  message: Scalars['String']['output'];
};

export type AwardTransactionType = {
  __typename?: 'AwardTransactionType';
  type: AwardTransactionType;
};

export type Banner = {
  __typename?: 'Banner';
  asset?: Maybe<Image>;
  cta: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  route: PageRoute;
  title: Scalars['String']['output'];
};

export type BannersConnection = {
  __typename?: 'BannersConnection';
  banners?: Maybe<Array<Banner>>;
};

export type BlockCommenterOnPostInput = {
  commenterId: Scalars['ID']['input'];
  operation: BlockOperationType;
  postId: Scalars['ID']['input'];
};

export type BlockCommenterOnPostOutput = BlockCommenterOnPostResult | SmartError;

export type BlockCommenterOnPostResult = {
  __typename?: 'BlockCommenterOnPostResult';
  commenterId: Scalars['ID']['output'];
  operation: BlockOperationType;
  postId: Scalars['ID']['output'];
};

export enum BlockOperationType {
  Block = 'BLOCK',
  UnBlock = 'UN_BLOCK'
}

export type BlockUserInput = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type BlockUserOutput = BlockUserResult | SmartError;

export type BlockUserResult = {
  __typename?: 'BlockUserResult';
  isSuccessful: Scalars['Boolean']['output'];
};

export type BlockedUsersEdge = {
  __typename?: 'BlockedUsersEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type BlockedUsersList = {
  __typename?: 'BlockedUsersList';
  edges?: Maybe<Array<BlockedUsersEdge>>;
  pageInfo: PageInfo;
};

export type CategoryTypeWithCategories = {
  __typename?: 'CategoryTypeWithCategories';
  categories: Array<PostCategory>;
  name?: Maybe<Scalars['String']['output']>;
};

export type Challenge = Node & {
  __typename?: 'Challenge';
  allEntriesConnection?: Maybe<ChallengeEntriesConnection>;
  author?: Maybe<User>;
  authorInteractionsConnection?: Maybe<ChallengeAuthorInteractionConnection>;
  categories?: Maybe<Array<Maybe<PostCategory>>>;
  commentPostingAccessControlContext?: Maybe<CommentPostingAccessControlContext>;
  commentVisibilityAccessControlContext?: Maybe<CommentVisibilityAccessControlContext>;
  commentsConnection?: Maybe<ChallengeCommentsConnection>;
  cover?: Maybe<ChallengeCover>;
  currentUserContext?: Maybe<ChallengeCurrentUserContext>;
  currentUserEntriesConnection?: Maybe<ChallengeEntriesConnection>;
  description?: Maybe<Content>;
  featuredEntriesConnection?: Maybe<ChallengeEntriesConnection>;
  id: Scalars['ID']['output'];
  isCompleted?: Maybe<Scalars['Boolean']['output']>;
  isOwner?: Maybe<Scalars['Boolean']['output']>;
  leaderboardConnection?: Maybe<ChallengeLeaderboardConnection>;
  name: Scalars['String']['output'];
  participantsConnection?: Maybe<ChallengeParticipantsConnection>;
  pinnedComment?: Maybe<Comment>;
  pinnedCommentId?: Maybe<Scalars['ID']['output']>;
  previewParticipants?: Maybe<ChallengePreviewParticipants>;
  stats?: Maybe<ChallengeStats>;
  todayEntriesConnection?: Maybe<ChallengeEntriesConnection>;
  ts?: Maybe<Timestamps>;
  userEntriesConnection?: Maybe<ChallengeEntriesConnection>;
  willBeDeleted?: Maybe<Scalars['Boolean']['output']>;
};


export type ChallengeAllEntriesConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  paginationInput: PaginationInput;
  targetEntryId?: InputMaybe<Scalars['ID']['input']>;
};


export type ChallengeAuthorInteractionsConnectionArgs = {
  listType?: InputMaybe<ChallengeAuthorInteractionListType>;
};


export type ChallengeCommentsConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  paginationInput: PaginationInput;
  targetCommentId?: InputMaybe<Scalars['ID']['input']>;
};


export type ChallengeCurrentUserEntriesConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  paginationInput: PaginationInput;
  targetEntryId?: InputMaybe<Scalars['ID']['input']>;
};


export type ChallengeFeaturedEntriesConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  paginationInput: PaginationInput;
  targetEntryId?: InputMaybe<Scalars['ID']['input']>;
};


export type ChallengeLeaderboardConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  paginationInput: PaginationInput;
};


export type ChallengeParticipantsConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  isRequestingFriendParticipants?: InputMaybe<Scalars['Boolean']['input']>;
  paginationInput: PaginationInput;
  targetParticipantId?: InputMaybe<Scalars['ID']['input']>;
};


export type ChallengeTodayEntriesConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  paginationInput: PaginationInput;
  targetEntryId?: InputMaybe<Scalars['ID']['input']>;
};


export type ChallengeUserEntriesConnectionArgs = {
  challengeId: Scalars['ID']['input'];
  paginationInput: PaginationInput;
  targetEntryId?: InputMaybe<Scalars['ID']['input']>;
  userToSearchForId?: InputMaybe<Scalars['ID']['input']>;
};

export type ChallengeAuthorInteractionConnection = {
  __typename?: 'ChallengeAuthorInteractionConnection';
  interactionCount: Scalars['Int']['output'];
};

export enum ChallengeAuthorInteractionListType {
  Today = 'TODAY'
}

export type ChallengeCommentEdge = {
  __typename?: 'ChallengeCommentEdge';
  cursor: Scalars['String']['output'];
  node: Comment;
};

export type ChallengeCommentsConnection = {
  __typename?: 'ChallengeCommentsConnection';
  edges?: Maybe<Array<ChallengeCommentEdge>>;
  pageInfo: PageInfo;
  targetCommentError?: Maybe<Scalars['String']['output']>;
};

export type ChallengeCover = {
  __typename?: 'ChallengeCover';
  coverImage?: Maybe<ChallengeCoverImage>;
  coverImageEnum?: Maybe<ChallengeCoverEnum>;
};

export enum ChallengeCoverEnum {
  Type_1 = 'TYPE_1',
  Type_2 = 'TYPE_2',
  Type_3 = 'TYPE_3',
  Type_4 = 'TYPE_4',
  Type_5 = 'TYPE_5',
  Type_6 = 'TYPE_6',
  Type_7 = 'TYPE_7',
  Type_8 = 'TYPE_8'
}

export type ChallengeCoverImage = {
  __typename?: 'ChallengeCoverImage';
  image?: Maybe<Image>;
  thumbnail?: Maybe<Image>;
};

export type ChallengeCoverImageInput = {
  image: Scalars['Upload']['input'];
  thumbnail?: InputMaybe<Scalars['Upload']['input']>;
};

export type ChallengeCurrentUserContext = {
  __typename?: 'ChallengeCurrentUserContext';
  hasJoined?: Maybe<Scalars['Boolean']['output']>;
  isOwner?: Maybe<Scalars['Boolean']['output']>;
};

export type ChallengeEdge = {
  __typename?: 'ChallengeEdge';
  cursor: Scalars['String']['output'];
  node: Challenge;
};

export type ChallengeEntriesConnection = {
  __typename?: 'ChallengeEntriesConnection';
  edges?: Maybe<Array<ChallengeEntryEdge>>;
  pageInfo: PageInfo;
  targetEntryError?: Maybe<Scalars['String']['output']>;
  userToSearchForId?: Maybe<Scalars['ID']['output']>;
};

export type ChallengeEntryEdge = {
  __typename?: 'ChallengeEntryEdge';
  cursor: Scalars['String']['output'];
  node: Post;
};

export enum ChallengeEntryPinFlag {
  Pin = 'PIN',
  Unpin = 'UNPIN'
}

export type ChallengeInteractionResult = {
  challenge?: Maybe<Challenge>;
};

export type ChallengeLeaderboardConnection = {
  __typename?: 'ChallengeLeaderboardConnection';
  edges?: Maybe<Array<ChallengeLeaderboardEdge>>;
  pageInfo: PageInfo;
};

export type ChallengeLeaderboardEdge = {
  __typename?: 'ChallengeLeaderboardEdge';
  cursor: Scalars['String']['output'];
  node: ChallengeParticipant;
};

export enum ChallengeListType {
  All = 'ALL',
  AllActive = 'ALL_ACTIVE',
  AllPast = 'ALL_PAST',
  Featured = 'FEATURED',
  MyChallenges = 'MY_CHALLENGES',
  OwnedChallenges = 'OWNED_CHALLENGES'
}

export type ChallengeParticipant = {
  __typename?: 'ChallengeParticipant';
  entryCount?: Maybe<Scalars['Int']['output']>;
  isCreator?: Maybe<Scalars['Boolean']['output']>;
  isFriend?: Maybe<Scalars['Boolean']['output']>;
  post?: Maybe<Post>;
  user: User;
};

export type ChallengeParticipantsConnection = {
  __typename?: 'ChallengeParticipantsConnection';
  edges?: Maybe<Array<ChallengeParticipantsEdge>>;
  pageInfo: PageInfo;
  targetParticipantError?: Maybe<Scalars['String']['output']>;
};

export type ChallengeParticipantsEdge = {
  __typename?: 'ChallengeParticipantsEdge';
  cursor: Scalars['String']['output'];
  node: ChallengeParticipant;
};

export type ChallengePreviewParticipants = {
  __typename?: 'ChallengePreviewParticipants';
  displayText?: Maybe<Scalars['String']['output']>;
  participants?: Maybe<Array<User>>;
};

export enum ChallengeState {
  Active = 'ACTIVE',
  Created = 'CREATED',
  Ended = 'ENDED'
}

export type ChallengeStats = {
  __typename?: 'ChallengeStats';
  commentCount: Scalars['Int']['output'];
  entryCount: Scalars['Int']['output'];
  participantCount: Scalars['Int']['output'];
  reportCount: Scalars['Int']['output'];
  shareCount: Scalars['Int']['output'];
};

export type ChallengeTimestamps = {
  __typename?: 'ChallengeTimestamps';
  endDate?: Maybe<Scalars['DateTime']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
};

export type ChallengeTrollDetectionData = {
  __typename?: 'ChallengeTrollDetectionData';
  message?: Maybe<Scalars['String']['output']>;
  result?: Maybe<Scalars['String']['output']>;
};

export type ChallengeTrollDetectionError = Error & {
  __typename?: 'ChallengeTrollDetectionError';
  description?: Maybe<ChallengeTrollDetectionData>;
  message: Scalars['String']['output'];
  name?: Maybe<ChallengeTrollDetectionData>;
};

export type Check3rdPartyOutput = Check3rdPartyResult | SmartError;

export type Check3rdPartyResult = {
  __typename?: 'Check3rdPartyResult';
  doesExist?: Maybe<Scalars['Boolean']['output']>;
};

export type CheckAndRedeemInviteCodeInput = {
  code: Scalars['Int']['input'];
};

export type CheckAndRedeemInviteCodeOutput = CheckAndRedeemInviteCodeResult | SmartError;

export type CheckAndRedeemInviteCodeResult = {
  __typename?: 'CheckAndRedeemInviteCodeResult';
  hasBeenRedeemed?: Maybe<Scalars['Boolean']['output']>;
  isValid?: Maybe<Scalars['Boolean']['output']>;
  payload?: Maybe<Scalars['String']['output']>;
};

export type CheckEmailOutput = CheckEmailResult | SmartError;

export type CheckEmailResult = {
  __typename?: 'CheckEmailResult';
  doesExist?: Maybe<Scalars['Boolean']['output']>;
};

export type CheckHandleOutput = CheckHandleResult | SmartError;

export type CheckHandleResult = {
  __typename?: 'CheckHandleResult';
  doesExist?: Maybe<Scalars['Boolean']['output']>;
};

export type Comment = Node & {
  __typename?: 'Comment';
  author?: Maybe<User>;
  body?: Maybe<Content>;
  commentContext?: Maybe<CommentContext>;
  commentStats?: Maybe<CommentStats>;
  id: Scalars['ID']['output'];
  participationType?: Maybe<ParticipationType>;
  /** @deprecated Use commentContext instead */
  postCommentContext?: Maybe<PostCommentContext>;
  reactionsConnection?: Maybe<CommentReactionsConnection>;
  repliesConnection?: Maybe<CommentRepliesConnection>;
  ts?: Maybe<Timestamps>;
};


export type CommentReactionsConnectionArgs = {
  paginationInput: PaginationInput;
  reactionType: ReactionType;
};


export type CommentRepliesConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  commentId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  includingAndAfter?: InputMaybe<Scalars['String']['input']>;
  includingAndBefore?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
  targetReplyId?: InputMaybe<Scalars['ID']['input']>;
};

export type CommentContext = {
  __typename?: 'CommentContext';
  liked?: Maybe<Scalars['Boolean']['output']>;
};

export type CommentEmbargoOnboardingLiftedOutput = CommentEmbargoOnboardingLiftedResult | SmartError;

export type CommentEmbargoOnboardingLiftedResult = {
  __typename?: 'CommentEmbargoOnboardingLiftedResult';
  lifted: Scalars['Boolean']['output'];
};

export type CommentEntry = {
  id: Scalars['ID']['output'];
  ts?: Maybe<Timestamps>;
};

export enum CommentPostingAccess {
  Everyone = 'EVERYONE',
  Followers = 'FOLLOWERS',
  InnerCircle = 'INNER_CIRCLE',
  List = 'LIST',
  None = 'NONE'
}

export type CommentPostingAccessControlContext = {
  __typename?: 'CommentPostingAccessControlContext';
  canComment?: Maybe<Scalars['Boolean']['output']>;
  cannotCommentErrorMessage?: Maybe<Scalars['String']['output']>;
  commentPostingAccess?: Maybe<CommentPostingAccess>;
};

export type CommentPostingAccessData = {
  access: CommentPostingAccess;
  listIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CommentReactionsConnection = {
  __typename?: 'CommentReactionsConnection';
  count: Scalars['Int']['output'];
  edges?: Maybe<Array<CommentReactionsEdge>>;
  pageInfo: PageInfo;
};

export type CommentReactionsEdge = {
  __typename?: 'CommentReactionsEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type CommentRepliesConnection = {
  __typename?: 'CommentRepliesConnection';
  edges?: Maybe<Array<CommentRepliesEdge>>;
  pageInfo: PageInfo;
  targetReplyError?: Maybe<Scalars['String']['output']>;
};

export type CommentRepliesEdge = {
  __typename?: 'CommentRepliesEdge';
  cursor: Scalars['String']['output'];
  node: Reply;
};

export type CommentReplyContext = {
  __typename?: 'CommentReplyContext';
  liked?: Maybe<Scalars['Boolean']['output']>;
};

export type CommentStats = {
  __typename?: 'CommentStats';
  likeCount?: Maybe<Scalars['Int']['output']>;
  replyCount?: Maybe<Scalars['Int']['output']>;
  reportCount?: Maybe<Scalars['Int']['output']>;
};

export enum CommentVisibilityAccess {
  Author = 'AUTHOR',
  Everyone = 'EVERYONE',
  Followers = 'FOLLOWERS',
  InnerCircle = 'INNER_CIRCLE',
  List = 'LIST',
  None = 'NONE'
}

export type CommentVisibilityAccessControlContext = {
  __typename?: 'CommentVisibilityAccessControlContext';
  canViewComment?: Maybe<Scalars['Boolean']['output']>;
  cannotViewCommentErrorMessage?: Maybe<Scalars['String']['output']>;
  commentVisibilityAccess?: Maybe<CommentVisibilityAccess>;
};

export type CommentVisibilityAccessData = {
  access: CommentVisibilityAccess;
  listIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum CommenterScope {
  All = 'ALL',
  Following = 'FOLLOWING',
  None = 'NONE'
}

export type Content = {
  __typename?: 'Content';
  body?: Maybe<Scalars['String']['output']>;
  lang?: Maybe<Language>;
  segments?: Maybe<Array<ContentSegment>>;
  wordCount?: Maybe<Scalars['Int']['output']>;
};

export type ContentInput = {
  segments?: InputMaybe<Array<SegmentPositionInput>>;
  tagSegments?: InputMaybe<Array<TagSegmentInput>>;
  textSegments?: InputMaybe<Array<TextSegmentInput>>;
  userSegments?: InputMaybe<Array<UserSegmentInput>>;
};

export type ContentSegment = Tag | Text | User;

export type CreateChallengeInput = {
  categoryIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  challengeLengthInDays?: InputMaybe<Scalars['Int']['input']>;
  coverEnum?: InputMaybe<ChallengeCoverEnum>;
  coverImage?: InputMaybe<ChallengeCoverImageInput>;
  description?: InputMaybe<ContentInput>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  trollDetectionOverride?: InputMaybe<TrollDetectionOverride>;
};

export type CreateChallengeOutput = ChallengeTrollDetectionError | CreateChallengeResult | SmartError;

export type CreateChallengeResult = {
  __typename?: 'CreateChallengeResult';
  challenge: Challenge;
  creator?: Maybe<User>;
};

export type CreateImagePostInput = {
  commenterScope?: InputMaybe<CommenterScope>;
  content?: InputMaybe<ContentInput>;
  expirationHourCount?: InputMaybe<Scalars['Int']['input']>;
  image: Scalars['Upload']['input'];
  mentions?: InputMaybe<Array<Scalars['ID']['input']>>;
  tags?: InputMaybe<Array<TagInput>>;
  thumbnail?: InputMaybe<Scalars['Upload']['input']>;
  visibility?: InputMaybe<PostVisibility>;
};

export type CreateMultiMediaPostInput = {
  accessControl?: InputMaybe<PostAccessControl>;
  caption?: InputMaybe<ContentInput>;
  challengeId?: InputMaybe<Scalars['ID']['input']>;
  commenterScope?: InputMaybe<CommenterScope>;
  expirationHourCount?: InputMaybe<Scalars['Int']['input']>;
  mentions?: InputMaybe<Array<Scalars['ID']['input']>>;
  negativeIndices?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  negativeResults?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  properties?: InputMaybe<Array<PostPropertiesInput>>;
  shouldBypassTrollDetection?: InputMaybe<Scalars['Boolean']['input']>;
  tags?: InputMaybe<Array<TagInput>>;
  thumbnail?: InputMaybe<Scalars['Upload']['input']>;
  visibility?: InputMaybe<PostVisibility>;
};

export type CreatePostOutput = CreatePostResult | SmartError | TrollDetectorError;

export type CreatePostResult = {
  __typename?: 'CreatePostResult';
  post: Post;
};

export type CreateTextPostInput = {
  commenterScope?: InputMaybe<CommenterScope>;
  content?: InputMaybe<ContentInput>;
  expirationHourCount?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<TagInput>>;
  visibility?: InputMaybe<PostVisibility>;
};

export type CreateUserListInput = {
  icon?: InputMaybe<Scalars['Upload']['input']>;
  iconUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateUserListOutput = CreateUserListResult | SmartError;

export type CreateUserListResult = {
  __typename?: 'CreateUserListResult';
  id?: Maybe<Scalars['ID']['output']>;
  isSuccessful?: Maybe<Scalars['String']['output']>;
};

export type CreateVideoPostInput = {
  commenterScope?: InputMaybe<CommenterScope>;
  content?: InputMaybe<ContentInput>;
  expirationHourCount?: InputMaybe<Scalars['Int']['input']>;
  mentions?: InputMaybe<Array<Scalars['ID']['input']>>;
  tags?: InputMaybe<Array<TagInput>>;
  thumbnail?: InputMaybe<Scalars['Upload']['input']>;
  video: Scalars['Upload']['input'];
  visibility?: InputMaybe<PostVisibility>;
};

export type DeleteCommentInput = {
  commentId: Scalars['ID']['input'];
};

export type DeleteCommentOutput = DeleteCommentResult | SmartError;

export type DeleteCommentResult = {
  __typename?: 'DeleteCommentResult';
  challenge?: Maybe<Challenge>;
  isSuccessful?: Maybe<Scalars['Boolean']['output']>;
  post?: Maybe<Post>;
};

export type DeleteFirebaseUserResult = {
  __typename?: 'DeleteFirebaseUserResult';
  isSuccessful: Scalars['Boolean']['output'];
};

export type DeletePostInput = {
  postId: Scalars['ID']['input'];
};

export type DeletePostOutput = DeletePostResult | SmartError;

export type DeletePostResult = {
  __typename?: 'DeletePostResult';
  post?: Maybe<Post>;
};

export type DeleteReplyInput = {
  replyId: Scalars['ID']['input'];
};

export type DeleteReplyOutput = DeleteReplyResult | SmartError;

export type DeleteReplyResult = {
  __typename?: 'DeleteReplyResult';
  isSuccessful?: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteUserListInput = {
  id: Scalars['ID']['input'];
};

export type DeleteUserListOutput = DeleteUserListResult | SmartError;

export type DeleteUserListResult = {
  __typename?: 'DeleteUserListResult';
  isSuccessful?: Maybe<Scalars['String']['output']>;
};

export type EsInput = {
  from?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
  query?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<ESearchType>;
  useNewSearch?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EsItem = ImagePost | MultiMediaPost | Tag | TextPost | User | VideoPost;

export enum EsItemType {
  Post = 'POST',
  Tag = 'TAG',
  User = 'USER'
}

export type EsOutput = EsResult | SmartError;

export type EsPostResult = {
  __typename?: 'ESPostResult';
  post: Post;
};

export type EsResult = {
  __typename?: 'ESResult';
  pageInfo?: Maybe<PageInfo>;
  result?: Maybe<Array<EsItem>>;
};

export enum ESearchType {
  All = 'ALL',
  Hashtags = 'HASHTAGS',
  Post = 'POST',
  Top = 'TOP',
  User = 'USER'
}

export type EditChallengeInput = {
  categoryIds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  coverEnum?: InputMaybe<ChallengeCoverEnum>;
  coverImage?: InputMaybe<ChallengeCoverImageInput>;
  deleteCoverImage?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<ContentInput>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  trollDetectionOverride?: InputMaybe<TrollDetectionOverride>;
};

export type EditChallengeOutput = ChallengeTrollDetectionError | EditChallengeResult | SmartError;

export type EditChallengeResult = {
  __typename?: 'EditChallengeResult';
  challenge: Challenge;
  creator?: Maybe<User>;
};

export type Error = {
  message: Scalars['String']['output'];
};

export type FeatureFlagsResult = {
  __typename?: 'FeatureFlagsResult';
  bannersEnabled?: Maybe<Scalars['Boolean']['output']>;
  coinDashboardPart1?: Maybe<Scalars['Boolean']['output']>;
  coinDashboardPart2?: Maybe<Scalars['Boolean']['output']>;
  /** @deprecated Only use createPostV2 */
  createPostV1?: Maybe<Scalars['Boolean']['output']>;
  createPostV2?: Maybe<Scalars['Boolean']['output']>;
  videoCompressionRes960x540Quality?: Maybe<Scalars['Boolean']['output']>;
};

export type Feed = {
  __typename?: 'Feed';
  id: Scalars['ID']['output'];
  messageCount?: Maybe<Scalars['Int']['output']>;
  postsConnection?: Maybe<FeedPostsConnection>;
  ts?: Maybe<Timestamps>;
};


export type FeedPostsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};

export type FeedEntry = {
  id: Scalars['ID']['output'];
  ts?: Maybe<Timestamps>;
};

export type FeedPostsConnection = {
  __typename?: 'FeedPostsConnection';
  edges?: Maybe<Array<FeedPostsEdge>>;
  pageInfo: PageInfo;
};

export type FeedPostsEdge = {
  __typename?: 'FeedPostsEdge';
  cursor: Scalars['String']['output'];
  node: Post;
};

export enum FeedScopeType {
  Following = 'FOLLOWING',
  Global = 'GLOBAL',
  InnerCircleConsumption = 'INNER_CIRCLE_CONSUMPTION',
  InnerCircleDistribution = 'INNER_CIRCLE_DISTRIBUTION',
  ListConsumption = 'LIST_CONSUMPTION',
  ListDistribution = 'LIST_DISTRIBUTION',
  Personalized = 'PERSONALIZED',
  PersonalizedFollowing = 'PERSONALIZED_FOLLOWING',
  Public = 'PUBLIC'
}

export enum FeedType {
  All = 'ALL',
  Image = 'IMAGE',
  MultiMedia = 'MULTI_MEDIA',
  Text = 'TEXT',
  Video = 'VIDEO'
}

export type FirebaseAuthEmailInput = {
  canSignup?: InputMaybe<Scalars['Boolean']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fcmToken?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  uid: Scalars['String']['input'];
};

export type FirebaseAuthOutput = AskForHandleAndNameError | LoginOutput | SmartError;

export type FirebaseAuthPhoneNumberInput = {
  canSignup?: InputMaybe<Scalars['Boolean']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fcmToken?: InputMaybe<Scalars['String']['input']>;
  phoneNumber: Scalars['String']['input'];
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  uid: Scalars['String']['input'];
};

export type FirebaseSignupInput = {
  birthday?: InputMaybe<Scalars['Date']['input']>;
  categoryIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  email?: InputMaybe<Scalars['String']['input']>;
  fcmToken?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  handle: Scalars['String']['input'];
  image?: InputMaybe<Scalars['Upload']['input']>;
  inviteCode?: InputMaybe<Scalars['Int']['input']>;
  language: Scalars['String']['input'];
  linkData?: InputMaybe<LinkData>;
  name?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  uid: Scalars['String']['input'];
};

export type FirebaseSignupOutput = AskForHandleAndNameError | HandleAlreadyTakenError | SignUpOutput | SmartError;

export type FlagCommentInput = {
  commentId: Scalars['ID']['input'];
  operation: FlagOperationType;
};

export type FlagCommentOutput = FlagCommentResult | SmartError;

export type FlagCommentResult = {
  __typename?: 'FlagCommentResult';
  comment?: Maybe<Comment>;
  parentChallenge?: Maybe<Challenge>;
  parentPost?: Maybe<Post>;
};

export enum FlagOperationType {
  Flag = 'FLAG',
  UnFlag = 'UN_FLAG'
}

export type FollowUserInput = {
  userId: Scalars['ID']['input'];
};

export type FollowUserOutput = FollowUserResult | SmartError;

export type FollowUserResult = {
  __typename?: 'FollowUserResult';
  currentUser?: Maybe<User>;
};

export type FollowerEdge = {
  __typename?: 'FollowerEdge';
  isFollowing?: Maybe<Scalars['Boolean']['output']>;
};

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  NotSpecified = 'NOT_SPECIFIED',
  Other = 'OTHER'
}

export type Get3rdPartyDetailsOutput = Get3rdPartyDetailsResult | SmartError;

export type Get3rdPartyDetailsResult = {
  __typename?: 'Get3rdPartyDetailsResult';
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type GetBlockListInput = {
  userId: Scalars['String']['input'];
};

export type GetBlockListOutput = GetBlockListResult | SmartError;

export type GetBlockListResult = {
  __typename?: 'GetBlockListResult';
  user?: Maybe<User>;
};

export type GetCategoriesOutput = GetCategoriesResult | SmartError;

export type GetCategoriesResult = {
  __typename?: 'GetCategoriesResult';
  categories: Array<PostCategory>;
  userCategoryInterests?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type GetCategoriesWithTypesInput = {
  shouldAddUserPreferences?: InputMaybe<Scalars['Boolean']['input']>;
};

export type GetCategoriesWithTypesOutput = GetCategoriesWithTypesResult | SmartError;

export type GetCategoriesWithTypesResult = {
  __typename?: 'GetCategoriesWithTypesResult';
  categories: Array<CategoryTypeWithCategories>;
};

export type GetChallengeInput = {
  id: Scalars['ID']['input'];
};

export type GetChallengeOutput = GetChallengeResult | SmartError;

export type GetChallengeResult = {
  __typename?: 'GetChallengeResult';
  challenge: Challenge;
};

export type GetChallengesInput = {
  paginationInput: PaginationInput;
  type?: InputMaybe<ChallengeListType>;
};

export type GetChallengesOutput = GetChallengesResult | SmartError;

export type GetChallengesResult = {
  __typename?: 'GetChallengesResult';
  edges?: Maybe<Array<ChallengeEdge>>;
  pageInfo: PageInfo;
};

export type GetCommentInput = {
  id: Scalars['ID']['input'];
};

export type GetCommentOutput = GetCommentResult | SmartError;

export type GetCommentResult = {
  __typename?: 'GetCommentResult';
  comment?: Maybe<Comment>;
};

export type GetFeatureFlagsOutput = FeatureFlagsResult | SmartError;

export type GetFeedInput = {
  authorId?: InputMaybe<Scalars['ID']['input']>;
  feedType?: InputMaybe<FeedType>;
  listId?: InputMaybe<Scalars['ID']['input']>;
  postType?: InputMaybe<PostKind>;
  scopeType?: InputMaybe<FeedScopeType>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type GetFeedOutput = GetFeedResult | SmartError;

export type GetFeedResult = {
  __typename?: 'GetFeedResult';
  feed?: Maybe<Feed>;
};

export type GetFollowersListInput = {
  userId: Scalars['String']['input'];
};

export type GetFollowersListOutput = GetFollowersListResult | SmartError;

export type GetFollowersListResult = {
  __typename?: 'GetFollowersListResult';
  user?: Maybe<User>;
};

export type GetFollowingsListInput = {
  userId: Scalars['String']['input'];
};

export type GetFollowingsListOutput = GetFollowingsListResult | SmartError;

export type GetFollowingsListResult = {
  __typename?: 'GetFollowingsListResult';
  user?: Maybe<User>;
};

export type GetInviteCodeInput = {
  action?: InputMaybe<InviteCodeAction>;
  userId: Scalars['String']['input'];
};

export type GetInviteCodeOutput = GetInviteCodeResult | SmartError;

export type GetInviteCodeResult = {
  __typename?: 'GetInviteCodeResult';
  code?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<User>;
};

export type GetJoinedChallengesInput = {
  challengeState?: InputMaybe<ChallengeState>;
};

export type GetJoinedChallengesOutput = GetJoinedChallengesResult | SmartError;

export type GetJoinedChallengesResult = {
  __typename?: 'GetJoinedChallengesResult';
  challenges?: Maybe<Array<Maybe<Challenge>>>;
};

export type GetMyChallengesInput = {
  paginationInput: PaginationInput;
};

export type GetMyChallengesOutput = GetMyChallengesResult | SmartError;

export type GetMyChallengesResult = {
  __typename?: 'GetMyChallengesResult';
  edges?: Maybe<Array<ChallengeEdge>>;
  pageInfo: PageInfo;
};

export type GetOrDeleteFirebaseUserOutput = DeleteFirebaseUserResult | SignUpOutput;

export type GetPostInput = {
  id: Scalars['ID']['input'];
};

export type GetPostOutput = GetPostResult | SmartError;

export type GetPostResult = {
  __typename?: 'GetPostResult';
  post?: Maybe<Post>;
};

export type GetPostTypesOutput = GetPostTypesResult | SmartError;

export type GetPostTypesResult = {
  __typename?: 'GetPostTypesResult';
  postTypes: Array<PostType>;
  userPostTypeInterests?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type GetReplyInput = {
  id: Scalars['ID']['input'];
};

export type GetReplyOutput = GetReplyResult | SmartError;

export type GetReplyResult = {
  __typename?: 'GetReplyResult';
  reply?: Maybe<Reply>;
};

export type GetStrikeReportInput = {
  id: Scalars['ID']['input'];
};

export type GetStrikeReportOutput = ReviewReportRequest | SmartError;

export type GetUserInput = {
  id: Scalars['ID']['input'];
};

export type GetUserOutput = GetUserResult | SmartError;

export type GetUserResult = {
  __typename?: 'GetUserResult';
  user?: Maybe<User>;
};

export type GetWalletInput = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type GetWalletOutput = GetWalletResult | SmartError;

export type GetWalletResult = {
  __typename?: 'GetWalletResult';
  wallet?: Maybe<Wallet>;
};

export type GetWebAppFeatureFlagsOutput = GetWebAppFeatureFlagsResult | SmartError;

export type GetWebAppFeatureFlagsResult = {
  __typename?: 'GetWebAppFeatureFlagsResult';
  wildrCoinWaitlistEnabled: Scalars['Boolean']['output'];
};

export type HandleAlreadyTakenError = Error & {
  __typename?: 'HandleAlreadyTakenError';
  message: Scalars['String']['output'];
};

export type Image = {
  __typename?: 'Image';
  id: Scalars['ID']['output'];
  source?: Maybe<MediaSource>;
  type?: Maybe<ImageType>;
};

export type ImagePost = FeedEntry & Node & Post & {
  __typename?: 'ImagePost';
  accessControl?: Maybe<PostAccessControlData>;
  accessControlContext?: Maybe<PostAccessControlContext>;
  applaudReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  author?: Maybe<User>;
  baseType?: Maybe<PostBaseType>;
  canComment?: Maybe<Scalars['Boolean']['output']>;
  caption?: Maybe<Content>;
  commentPostingAccessControlContext?: Maybe<CommentPostingAccessControlContext>;
  commentVisibilityAccessControlContext?: Maybe<CommentVisibilityAccessControlContext>;
  commentsConnection?: Maybe<PostCommentsConnection>;
  id: Scalars['ID']['output'];
  image?: Maybe<Image>;
  isHiddenOnChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPinnedToChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  likeReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  parentChallengeId?: Maybe<Scalars['ID']['output']>;
  pinnedComment?: Maybe<Comment>;
  postContext?: Maybe<PostContext>;
  realReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  repostAccessControlContext?: Maybe<RepostAccessControlContext>;
  sensitiveStatus?: Maybe<SensitiveStatus>;
  stats?: Maybe<PostStats>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  thumbnail?: Maybe<Image>;
  ts?: Maybe<Timestamps>;
  willBeDeleted?: Maybe<Scalars['Boolean']['output']>;
};


export type ImagePostApplaudReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type ImagePostCommentsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includingAndAfter?: InputMaybe<Scalars['String']['input']>;
  includingAndBefore?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
  targetCommentId?: InputMaybe<Scalars['ID']['input']>;
};


export type ImagePostLikeReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type ImagePostRealReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};

export type ImagePostProperties = {
  __typename?: 'ImagePostProperties';
  image?: Maybe<Image>;
  thumbnail?: Maybe<Image>;
};

export type ImagePostPropertiesInput = {
  image: Scalars['Upload']['input'];
  thumbnail?: InputMaybe<Scalars['Upload']['input']>;
};

export enum ImageType {
  Jpeg = 'JPEG',
  Png = 'PNG',
  Webp = 'WEBP'
}

export enum InviteCodeAction {
  AddToFollowingList = 'ADD_TO_FOLLOWING_LIST',
  AddToInnerList = 'ADD_TO_INNER_LIST',
  ShareChallenge = 'SHARE_CHALLENGE'
}

export type InviteEdge = {
  __typename?: 'InviteEdge';
  cursor: Scalars['String']['output'];
  node: InviteNode;
};

export type InviteNode = {
  __typename?: 'InviteNode';
  state?: Maybe<InviteState>;
  user?: Maybe<User>;
};

export enum InviteState {
  JoinedPendingVerification = 'JOINED_PENDING_VERIFICATION',
  JoinedVerified = 'JOINED_VERIFIED'
}

export type InvitesConnection = {
  __typename?: 'InvitesConnection';
  edges?: Maybe<Array<InviteEdge>>;
  pageInfo: PageInfo;
};

export type InvitesConnectionInput = {
  paginationInput: PaginationInput;
};

export type IsEmailVerifiedOutput = IsEmailVerifiedResult | SmartError;

export type IsEmailVerifiedResult = {
  __typename?: 'IsEmailVerifiedResult';
  isEmailVerified: Scalars['Boolean']['output'];
};

export type JoinChallengeInput = {
  id: Scalars['ID']['input'];
};

export type JoinChallengeOutput = JoinChallengeResult | SmartError;

export type JoinChallengeResult = {
  __typename?: 'JoinChallengeResult';
  challenge?: Maybe<Challenge>;
};

export type KeyValuePair = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type Language = {
  __typename?: 'Language';
  code?: Maybe<Scalars['String']['output']>;
};

export type LeaveChallengeInput = {
  id: Scalars['ID']['input'];
};

export type LeaveChallengeOutput = LeaveChallengeResult | SmartError;

export type LeaveChallengeResult = {
  __typename?: 'LeaveChallengeResult';
  challenge?: Maybe<Challenge>;
};

export type LinkData = {
  linkId: Scalars['String']['input'];
  otherParams?: InputMaybe<Array<KeyValuePair>>;
  pseudoUserId: Scalars['String']['input'];
  refererId: Scalars['String']['input'];
  sourceId: Scalars['String']['input'];
  sourceType: LinkSourceType;
};

export enum LinkSourceType {
  Challenge = 'CHALLENGE',
  Post = 'POST',
  User = 'USER'
}

export type ListVisibility = {
  __typename?: 'ListVisibility';
  follower?: Maybe<UserListVisibility>;
  following?: Maybe<UserListVisibility>;
};

export type LoginOutput = {
  __typename?: 'LoginOutput';
  jwtToken?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type MediaSource = {
  __typename?: 'MediaSource';
  uri?: Maybe<Scalars['URL']['output']>;
};

export type MediaSourceInput = {
  uri?: InputMaybe<Scalars['URL']['input']>;
};

export type MiscObject = Challenge | Comment | MultiMediaPost | Reply | ReviewReportRequest | User;

export type MultiMediaPost = FeedEntry & Node & Post & {
  __typename?: 'MultiMediaPost';
  accessControl?: Maybe<PostAccessControlData>;
  /** @deprecated This context has been split it sub contexts */
  accessControlContext?: Maybe<PostAccessControlContext>;
  applaudReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  author?: Maybe<User>;
  baseType?: Maybe<PostBaseType>;
  /** @deprecated Use commentPostingAccessControlContext instead */
  canComment?: Maybe<Scalars['Boolean']['output']>;
  caption?: Maybe<Content>;
  commentPostingAccessControlContext?: Maybe<CommentPostingAccessControlContext>;
  commentVisibilityAccessControlContext?: Maybe<CommentVisibilityAccessControlContext>;
  commentsConnection?: Maybe<PostCommentsConnection>;
  id: Scalars['ID']['output'];
  isHiddenOnChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPinnedToChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  likeReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  parentChallenge?: Maybe<Challenge>;
  parentChallengeId?: Maybe<Scalars['ID']['output']>;
  pinnedComment?: Maybe<Comment>;
  postContext?: Maybe<PostContext>;
  properties?: Maybe<Array<Maybe<PostProperties>>>;
  realReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  repostAccessControlContext?: Maybe<RepostAccessControlContext>;
  repostMeta?: Maybe<RepostMeta>;
  sensitiveStatus?: Maybe<SensitiveStatus>;
  stats?: Maybe<PostStats>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  thumbnail?: Maybe<Image>;
  ts?: Maybe<Timestamps>;
  willBeDeleted?: Maybe<Scalars['Boolean']['output']>;
};


export type MultiMediaPostApplaudReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
  postId: Scalars['ID']['input'];
};


export type MultiMediaPostCommentsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includingAndAfter?: InputMaybe<Scalars['String']['input']>;
  includingAndBefore?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
  postId: Scalars['ID']['input'];
  targetCommentId?: InputMaybe<Scalars['ID']['input']>;
};


export type MultiMediaPostLikeReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
  postId: Scalars['ID']['input'];
};


export type MultiMediaPostRealReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
  postId: Scalars['ID']['input'];
};


export type MultiMediaPostRepostMetaArgs = {
  repostedPostsPaginationInput?: InputMaybe<PaginationInput>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addComment?: Maybe<AddCommentOutput>;
  addEmailToWaitlist: AddEmailToWaitlistOutput;
  addMemberToInnerCircle: UpdateMemberListOutput;
  addMemberToList: UpdateMemberListOutput;
  addReply?: Maybe<AddReplyOutput>;
  addUserToWaitlist: AddUserToWaitlistOutput;
  blockCommenterOnPost: BlockCommenterOnPostOutput;
  blockUser: BlockUserOutput;
  createChallenge: CreateChallengeOutput;
  createImagePost: CreatePostOutput;
  createMultiMediaPost: CreatePostOutput;
  createTextPost: CreatePostOutput;
  createUserList: CreateUserListOutput;
  createVideoPost: CreatePostOutput;
  deleteComment?: Maybe<DeleteCommentOutput>;
  deletePost?: Maybe<DeletePostOutput>;
  deleteReply?: Maybe<DeleteReplyOutput>;
  deleteUserList: DeleteUserListOutput;
  editChallenge: EditChallengeOutput;
  finishOnboarding: OnboardingUpdateOutput;
  firebaseEmailAuthentication?: Maybe<FirebaseAuthOutput>;
  firebasePhoneNumberAuthentication?: Maybe<FirebaseAuthOutput>;
  firebaseSignup?: Maybe<FirebaseSignupOutput>;
  flagComment: FlagCommentOutput;
  followUser: FollowUserOutput;
  getOrDeleteFirebaseUser: GetOrDeleteFirebaseUserOutput;
  joinChallenge: JoinChallengeOutput;
  leaveChallenge: LeaveChallengeOutput;
  login: LoginOutput;
  pinChallengeEntry: PinChallengeEntryOutput;
  pinComment?: Maybe<PinCommentOutput>;
  /** @deprecated Use pinComment instead for unified api */
  pinCommentOnChallenge: PinCommentOnChallengeOutput;
  reactOnComment: ReactOnCommentOutput;
  reactOnPost: ReactOnPostOutput;
  reactOnReply: ReactOnReplyOutput;
  removeAvatar: RemoveUserAvatarOutput;
  removeFollower: RemoveFollowerOutput;
  removeMemberFromInnerCircle: UpdateMemberListOutput;
  removeMemberFromList: UpdateMemberListOutput;
  reportChallenge: ReportChallengeOutput;
  reportComment?: Maybe<ReportCommentOutput>;
  reportPost?: Maybe<ReportPostOutput>;
  reportReply?: Maybe<ReportReplyOutput>;
  reportUser?: Maybe<ReportUserOutput>;
  repost: RepostOutput;
  requestDeleteUser: RequestDeleteUserOutput;
  sendContactUsEmail: SendContactUsEmailOutput;
  sharePost: SharePostOutput;
  signUpWithEmail: SignUpOutput;
  signUpWithPhoneNumber: SignUpOutput;
  skipBanner: SkipBannerOutput;
  skipOnboarding: OnboardingUpdateOutput;
  /** @deprecated Use pinComment instead unified api */
  unPinCommentOnChallenge: UnPinCommentOnChallengeOutput;
  unblockUser: UnblockUserOutput;
  unfollowUser: UnfollowUserOutput;
  updateAvatar: UpdateUserAvatarOutput;
  updateBio: UpdateBioOutput;
  updateCategoryInterests: UpdateCategoryInterestsOutput;
  updateCommentEmbargoOnboardingAt: CommentEmbargoOnboardingLiftedOutput;
  updateCommentParticipation?: Maybe<UpdateCommentParticipationOutput>;
  updateEmail: UpdateEmailOutput;
  updateFCMToken: UpdateFcmTokenOutput;
  updateHandle: UpdateHandleOutput;
  updateLastSeenCursor: UpdateLastSeenCursorOutput;
  updateListVisibility: UpdateListVisibilityOutput;
  updateName: UpdateNameOutput;
  updatePhoneNumber: UpdatePhoneNumberOutput;
  updatePostTypeInterests: UpdatePostTypeInterestsOutput;
  updatePronoun: UpdatePronounOutput;
  /** @deprecated Use wildrVerifiedManualReview() instead */
  updateRealIdStatus: UpdateRealIdVerificationOutput;
  uploadImage: UploadImageOutput;
  uploadVideo: UploadVideoOutput;
  wildrVerifiedManualReview?: Maybe<WildrVerifiedManualReviewOutput>;
};


export type MutationAddCommentArgs = {
  input: AddCommentInput;
};


export type MutationAddEmailToWaitlistArgs = {
  input?: InputMaybe<AddEmailToWaitlistInput>;
};


export type MutationAddMemberToInnerCircleArgs = {
  input: AddMemberToInnerCircleInput;
};


export type MutationAddMemberToListArgs = {
  input: AddMemberToListInput;
};


export type MutationAddReplyArgs = {
  input: AddReplyInput;
};


export type MutationAddUserToWaitlistArgs = {
  input?: InputMaybe<AddUserToWaitlistInput>;
};


export type MutationBlockCommenterOnPostArgs = {
  input: BlockCommenterOnPostInput;
};


export type MutationBlockUserArgs = {
  input: BlockUserInput;
};


export type MutationCreateChallengeArgs = {
  input: CreateChallengeInput;
};


export type MutationCreateImagePostArgs = {
  input: CreateImagePostInput;
};


export type MutationCreateMultiMediaPostArgs = {
  input: CreateMultiMediaPostInput;
};


export type MutationCreateTextPostArgs = {
  input: CreateTextPostInput;
};


export type MutationCreateUserListArgs = {
  input: CreateUserListInput;
};


export type MutationCreateVideoPostArgs = {
  input: CreateVideoPostInput;
};


export type MutationDeleteCommentArgs = {
  input?: InputMaybe<DeleteCommentInput>;
};


export type MutationDeletePostArgs = {
  input?: InputMaybe<DeletePostInput>;
};


export type MutationDeleteReplyArgs = {
  input?: InputMaybe<DeleteReplyInput>;
};


export type MutationDeleteUserListArgs = {
  input: DeleteUserListInput;
};


export type MutationEditChallengeArgs = {
  input: EditChallengeInput;
};


export type MutationFinishOnboardingArgs = {
  input: UpdateOnboardingInput;
};


export type MutationFirebaseEmailAuthenticationArgs = {
  input: FirebaseAuthEmailInput;
};


export type MutationFirebasePhoneNumberAuthenticationArgs = {
  input: FirebaseAuthPhoneNumberInput;
};


export type MutationFirebaseSignupArgs = {
  input: FirebaseSignupInput;
};


export type MutationFlagCommentArgs = {
  input: FlagCommentInput;
};


export type MutationFollowUserArgs = {
  input: FollowUserInput;
};


export type MutationGetOrDeleteFirebaseUserArgs = {
  uid: Scalars['String']['input'];
};


export type MutationJoinChallengeArgs = {
  input: JoinChallengeInput;
};


export type MutationLeaveChallengeArgs = {
  input: LeaveChallengeInput;
};


export type MutationLoginArgs = {
  fcmToken?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationPinChallengeEntryArgs = {
  input: PinChallengeEntryInput;
};


export type MutationPinCommentArgs = {
  input: PinCommentInput;
};


export type MutationPinCommentOnChallengeArgs = {
  input: PinCommentOnChallengeInput;
};


export type MutationReactOnCommentArgs = {
  input: ReactOnCommentInput;
};


export type MutationReactOnPostArgs = {
  input: ReactOnPostInput;
};


export type MutationReactOnReplyArgs = {
  input: ReactOnReplyInput;
};


export type MutationRemoveAvatarArgs = {
  shouldRemove?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationRemoveFollowerArgs = {
  input: RemoveFollowerInput;
};


export type MutationRemoveMemberFromInnerCircleArgs = {
  input: RemoveMemberFromInnerCircleInput;
};


export type MutationRemoveMemberFromListArgs = {
  input: RemoveMemberFromListInput;
};


export type MutationReportChallengeArgs = {
  input: ReportChallengeInput;
};


export type MutationReportCommentArgs = {
  input?: InputMaybe<ReportCommentInput>;
};


export type MutationReportPostArgs = {
  input?: InputMaybe<ReportPostInput>;
};


export type MutationReportReplyArgs = {
  input?: InputMaybe<ReportReplyInput>;
};


export type MutationReportUserArgs = {
  input?: InputMaybe<ReportUserInput>;
};


export type MutationRepostArgs = {
  input: RepostInput;
};


export type MutationRequestDeleteUserArgs = {
  requestDelete?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationSendContactUsEmailArgs = {
  input?: InputMaybe<SendContactUsEmailInput>;
};


export type MutationSharePostArgs = {
  input: SharePostInput;
};


export type MutationSignUpWithEmailArgs = {
  input: SignUpWithEmailInput;
};


export type MutationSignUpWithPhoneNumberArgs = {
  input: SignUpWithPhoneNumberInput;
};


export type MutationSkipBannerArgs = {
  input?: InputMaybe<SkipBannerInput>;
};


export type MutationSkipOnboardingArgs = {
  input: UpdateOnboardingInput;
};


export type MutationUnPinCommentOnChallengeArgs = {
  input: UnPinCommentOnChallengeInput;
};


export type MutationUnblockUserArgs = {
  input?: InputMaybe<UnblockUserInput>;
};


export type MutationUnfollowUserArgs = {
  input: UnfollowUserInput;
};


export type MutationUpdateAvatarArgs = {
  input: UpdateUserAvatarInput;
};


export type MutationUpdateBioArgs = {
  input: UpdateBioInput;
};


export type MutationUpdateCategoryInterestsArgs = {
  input: UpdateCategoryInterestsInput;
};


export type MutationUpdateCommentEmbargoOnboardingAtArgs = {
  shouldLift?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationUpdateCommentParticipationArgs = {
  input: UpdateCommentParticipationInput;
};


export type MutationUpdateEmailArgs = {
  input: UpdateEmailInput;
};


export type MutationUpdateFcmTokenArgs = {
  input: UpdateFcmTokenInput;
};


export type MutationUpdateHandleArgs = {
  input: UpdateHandleInput;
};


export type MutationUpdateLastSeenCursorArgs = {
  input: UpdateLastSeenCursorInput;
};


export type MutationUpdateListVisibilityArgs = {
  input: UpdateListVisibilityInput;
};


export type MutationUpdateNameArgs = {
  input: UpdateNameInput;
};


export type MutationUpdatePhoneNumberArgs = {
  input: UpdatePhoneNumberInput;
};


export type MutationUpdatePostTypeInterestsArgs = {
  input: UpdatePostTypeInterestsInput;
};


export type MutationUpdatePronounArgs = {
  input: UpdatePronounInput;
};


export type MutationUpdateRealIdStatusArgs = {
  input: UpdateRealIdVerificationInput;
};


export type MutationUploadImageArgs = {
  input: UploadImageInput;
};


export type MutationUploadVideoArgs = {
  input: UploadVideoInput;
};


export type MutationWildrVerifiedManualReviewArgs = {
  input: WildrVerifiedManualReviewInput;
};

export type Node = {
  id: Scalars['ID']['output'];
};

export type Notification = {
  __typename?: 'Notification';
  body?: Maybe<Content>;
  id: Scalars['ID']['output'];
};

export enum OsName {
  Android = 'ANDROID',
  Ios = 'IOS'
}

export enum ObjectType {
  Tag = 'TAG',
  Unknown = 'UNKNOWN',
  User = 'USER'
}

export type OnboardingStats = {
  __typename?: 'OnboardingStats';
  challengeAuthorInteractions?: Maybe<Scalars['Boolean']['output']>;
  challengeEducation?: Maybe<Scalars['Boolean']['output']>;
  challenges?: Maybe<Scalars['Boolean']['output']>;
  commentReplyLikes?: Maybe<Scalars['Boolean']['output']>;
  innerCircle?: Maybe<Scalars['Boolean']['output']>;
};

export enum OnboardingType {
  Challenges = 'CHALLENGES',
  ChallengeAuthorInteractions = 'CHALLENGE_AUTHOR_INTERACTIONS',
  ChallengeEducation = 'CHALLENGE_EDUCATION',
  CommentReplyLikes = 'COMMENT_REPLY_LIKES',
  InnerCircle = 'INNER_CIRCLE'
}

export type OnboardingUpdateOutput = OnboardingStats | SmartError;

export type OperationSuccessfulResult = {
  __typename?: 'OperationSuccessfulResult';
  isSuccessful: Scalars['Boolean']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  count?: Maybe<Scalars['Int']['output']>;
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  pageNumber?: Maybe<Scalars['Int']['output']>;
  startCursor?: Maybe<Scalars['String']['output']>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type PageRoute = WalletPageRoute;

export type PaginationInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  includingAndAfter?: InputMaybe<Scalars['String']['input']>;
  includingAndBefore?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<PaginationOrder>;
  pageNumber?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};

export enum PaginationOrder {
  Default = 'DEFAULT',
  LatestFirst = 'LATEST_FIRST',
  OldestFirst = 'OLDEST_FIRST'
}

export enum ParticipationType {
  Final = 'FINAL',
  Open = 'OPEN'
}

export enum PassFailState {
  Fail = 'FAIL',
  Pass = 'PASS'
}

export type PhoneNumberAccountExistInput = {
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type PhoneNumberAccountExistResult = {
  __typename?: 'PhoneNumberAccountExistResult';
  phoneNumberAccountExist?: Maybe<Scalars['Boolean']['output']>;
};

export type PhoneNumberUserExistsOutput = PhoneNumberAccountExistResult;

export type PinChallengeEntryInput = {
  challengeId: Scalars['ID']['input'];
  entryId: Scalars['ID']['input'];
  flag: ChallengeEntryPinFlag;
};

export type PinChallengeEntryOutput = PinChallengeEntryResult | SmartError;

export type PinChallengeEntryResult = {
  __typename?: 'PinChallengeEntryResult';
  challenge?: Maybe<Challenge>;
  entry?: Maybe<Post>;
};

export type PinCommentInput = {
  challengeId?: InputMaybe<Scalars['ID']['input']>;
  commentId?: InputMaybe<Scalars['ID']['input']>;
  postId?: InputMaybe<Scalars['ID']['input']>;
};

export type PinCommentOnChallengeInput = {
  challengeId: Scalars['ID']['input'];
  commentId: Scalars['ID']['input'];
};

export type PinCommentOnChallengeOutput = PinCommentOnChallengeResult | SmartError;

export type PinCommentOnChallengeResult = {
  __typename?: 'PinCommentOnChallengeResult';
  challenge?: Maybe<Challenge>;
  pinnedComment?: Maybe<Comment>;
};

export type PinCommentOutput = PinCommentResult | SmartError;

export type PinCommentResult = ChallengeInteractionResult & {
  __typename?: 'PinCommentResult';
  challenge?: Maybe<Challenge>;
  post?: Maybe<Post>;
};

export type Post = {
  accessControl?: Maybe<PostAccessControlData>;
  /** @deprecated This context has been split it sub context */
  accessControlContext?: Maybe<PostAccessControlContext>;
  applaudReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  author?: Maybe<User>;
  baseType?: Maybe<PostBaseType>;
  canComment?: Maybe<Scalars['Boolean']['output']>;
  commentPostingAccessControlContext?: Maybe<CommentPostingAccessControlContext>;
  commentVisibilityAccessControlContext?: Maybe<CommentVisibilityAccessControlContext>;
  commentsConnection?: Maybe<PostCommentsConnection>;
  id: Scalars['ID']['output'];
  isHiddenOnChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPinnedToChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  likeReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  parentChallengeId?: Maybe<Scalars['ID']['output']>;
  pinnedComment?: Maybe<Comment>;
  postContext?: Maybe<PostContext>;
  realReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  repostAccessControlContext?: Maybe<RepostAccessControlContext>;
  sensitiveStatus?: Maybe<SensitiveStatus>;
  stats?: Maybe<PostStats>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  ts?: Maybe<Timestamps>;
  willBeDeleted?: Maybe<Scalars['Boolean']['output']>;
};


export type PostApplaudReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type PostCommentsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includingAndAfter?: InputMaybe<Scalars['String']['input']>;
  includingAndBefore?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
  targetCommentId?: InputMaybe<Scalars['ID']['input']>;
};


export type PostLikeReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type PostRealReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};

export type PostAccessControl = {
  commentPostingAccessData: CommentPostingAccessData;
  commentVisibilityAccessData: CommentVisibilityAccessData;
  postVisibilityAccessData: PostVisibilityAccessData;
  repostAccessData?: InputMaybe<RepostAccessData>;
};

export type PostAccessControlContext = {
  __typename?: 'PostAccessControlContext';
  canComment?: Maybe<Scalars['Boolean']['output']>;
  canRepost?: Maybe<Scalars['Boolean']['output']>;
  canViewComment?: Maybe<Scalars['Boolean']['output']>;
  cannotCommentErrorMessage?: Maybe<Scalars['String']['output']>;
  cannotRepostErrorMessage?: Maybe<Scalars['String']['output']>;
  cannotViewCommentErrorMessage?: Maybe<Scalars['String']['output']>;
  commentPostingAccess?: Maybe<CommentPostingAccess>;
  commentVisibilityAccess?: Maybe<CommentVisibilityAccess>;
  postVisibility?: Maybe<PostVisibilityAccess>;
};

export type PostAccessControlData = {
  __typename?: 'PostAccessControlData';
  commentPostingAccess?: Maybe<CommentPostingAccess>;
  commentVisibilityAccess?: Maybe<CommentVisibilityAccess>;
  postVisibility?: Maybe<PostVisibilityAccess>;
  repostAccess?: Maybe<RepostAccess>;
};

export enum PostBaseType {
  Post = 'POST',
  Repost = 'REPOST',
  RepostStory = 'REPOST_STORY',
  Story = 'STORY'
}

export type PostCategory = {
  __typename?: 'PostCategory';
  id: Scalars['ID']['output'];
  type?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type PostCommentContext = {
  __typename?: 'PostCommentContext';
  liked?: Maybe<Scalars['Boolean']['output']>;
};

export type PostCommentsConnection = {
  __typename?: 'PostCommentsConnection';
  edges?: Maybe<Array<PostCommentsEdge>>;
  pageInfo: PageInfo;
  targetCommentError?: Maybe<Scalars['String']['output']>;
};

export type PostCommentsEdge = {
  __typename?: 'PostCommentsEdge';
  cursor: Scalars['String']['output'];
  node: Comment;
};

export type PostContext = {
  __typename?: 'PostContext';
  applauded?: Maybe<Scalars['Boolean']['output']>;
  liked?: Maybe<Scalars['Boolean']['output']>;
  realed?: Maybe<Scalars['Boolean']['output']>;
};

export enum PostKind {
  Audio = 'AUDIO',
  Image = 'IMAGE',
  MultiMedia = 'MULTI_MEDIA',
  Text = 'TEXT',
  Video = 'VIDEO'
}

export type PostNotFoundError = Error & {
  __typename?: 'PostNotFoundError';
  message: Scalars['String']['output'];
};

export type PostProperties = ImagePostProperties | TextPostProperties | VideoPostProperties;

export type PostPropertiesInput = {
  imageInput?: InputMaybe<ImagePostPropertiesInput>;
  textInput?: InputMaybe<TextPostPropertiesInput>;
  videoInput?: InputMaybe<VideoPostPropertiesInput>;
};

export type PostReactorsListConnection = {
  __typename?: 'PostReactorsListConnection';
  count?: Maybe<Scalars['Int']['output']>;
  edges?: Maybe<Array<UsersListEdge>>;
  pageInfo: PageInfo;
};

export type PostStats = {
  __typename?: 'PostStats';
  applauseCount: Scalars['Int']['output'];
  commentCount: Scalars['Int']['output'];
  hasHiddenComments: Scalars['Boolean']['output'];
  likeCount: Scalars['Int']['output'];
  realCount: Scalars['Int']['output'];
  reportCount: Scalars['Int']['output'];
  repostCount: Scalars['Int']['output'];
  shareCount: Scalars['Int']['output'];
};

export type PostType = {
  __typename?: 'PostType';
  name?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Int']['output']>;
};

export enum PostVisibility {
  All = 'ALL',
  Followers = 'FOLLOWERS'
}

export enum PostVisibilityAccess {
  Everyone = 'EVERYONE',
  Followers = 'FOLLOWERS',
  InnerCircle = 'INNER_CIRCLE',
  List = 'LIST'
}

export type PostVisibilityAccessData = {
  access: PostVisibilityAccess;
  listIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type Query = {
  __typename?: 'Query';
  check3rdParty: Check3rdPartyOutput;
  checkAndRedeemInviteCode?: Maybe<CheckAndRedeemInviteCodeOutput>;
  checkEmail: CheckEmailOutput;
  checkHandle?: Maybe<CheckHandleOutput>;
  checkPhoneNumberAccountExists?: Maybe<PhoneNumberUserExistsOutput>;
  elasticSearch: EsOutput;
  getBanners: BannersConnection;
  getBlockList: GetBlockListOutput;
  getCategories: GetCategoriesOutput;
  getCategoriesWithTypes: GetCategoriesWithTypesOutput;
  getChallenge: GetChallengeOutput;
  getChallenges: GetChallengesOutput;
  getComment?: Maybe<GetCommentOutput>;
  getDetailsFrom3rdPartyUid: Get3rdPartyDetailsOutput;
  getFeatureFlags: GetFeatureFlagsOutput;
  getFeed?: Maybe<GetFeedOutput>;
  getFollowersList: GetFollowersListOutput;
  getFollowingsList: GetFollowingsListOutput;
  getInviteCode?: Maybe<GetInviteCodeOutput>;
  getJoinedChallenges: GetJoinedChallengesOutput;
  getMyChallenges: GetMyChallengesOutput;
  getPost?: Maybe<GetPostOutput>;
  getPostTypes: GetPostTypesOutput;
  getReply?: Maybe<GetReplyOutput>;
  getStrikeReport: GetStrikeReportOutput;
  getUser: GetUserOutput;
  getWallet: GetWalletOutput;
  getWebAppFeatureFlags: GetWebAppFeatureFlagsOutput;
  getWildrAppConfig: WildrAppConfigOutput;
  isEmailVerified: IsEmailVerifiedOutput;
  search: SearchOutput;
  sendEmailVerificationLink?: Maybe<SendEmailVerificationOutput>;
};


export type QueryCheck3rdPartyArgs = {
  providerId: Scalars['String']['input'];
  uid: Scalars['String']['input'];
};


export type QueryCheckAndRedeemInviteCodeArgs = {
  input: CheckAndRedeemInviteCodeInput;
};


export type QueryCheckEmailArgs = {
  email: Scalars['String']['input'];
};


export type QueryCheckHandleArgs = {
  handle: Scalars['String']['input'];
};


export type QueryCheckPhoneNumberAccountExistsArgs = {
  input: PhoneNumberAccountExistInput;
};


export type QueryElasticSearchArgs = {
  input: EsInput;
};


export type QueryGetBlockListArgs = {
  input: GetBlockListInput;
};


export type QueryGetCategoriesArgs = {
  input: Scalars['String']['input'];
};


export type QueryGetCategoriesWithTypesArgs = {
  input: GetCategoriesWithTypesInput;
};


export type QueryGetChallengeArgs = {
  input: GetChallengeInput;
};


export type QueryGetChallengesArgs = {
  input: GetChallengesInput;
};


export type QueryGetCommentArgs = {
  input: GetCommentInput;
};


export type QueryGetDetailsFrom3rdPartyUidArgs = {
  providerId: Scalars['String']['input'];
  uid: Scalars['String']['input'];
};


export type QueryGetFeedArgs = {
  input?: InputMaybe<GetFeedInput>;
};


export type QueryGetFollowersListArgs = {
  input: GetFollowersListInput;
};


export type QueryGetFollowingsListArgs = {
  input: GetFollowingsListInput;
};


export type QueryGetInviteCodeArgs = {
  input: GetInviteCodeInput;
};


export type QueryGetJoinedChallengesArgs = {
  input: GetJoinedChallengesInput;
};


export type QueryGetMyChallengesArgs = {
  input: GetMyChallengesInput;
};


export type QueryGetPostArgs = {
  input?: InputMaybe<GetPostInput>;
};


export type QueryGetPostTypesArgs = {
  input: Scalars['String']['input'];
};


export type QueryGetReplyArgs = {
  input: GetReplyInput;
};


export type QueryGetStrikeReportArgs = {
  input: GetStrikeReportInput;
};


export type QueryGetUserArgs = {
  input: GetUserInput;
};


export type QueryGetWalletArgs = {
  input: GetWalletInput;
};


export type QueryGetWildrAppConfigArgs = {
  input: WildrAppConfigInput;
};


export type QueryIsEmailVerifiedArgs = {
  input?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchArgs = {
  input: SearchInput;
};


export type QuerySendEmailVerificationLinkArgs = {
  input: Scalars['String']['input'];
};

export type ReactOnCommentInput = {
  commentId: Scalars['ID']['input'];
  reaction: ReactionType;
};

export type ReactOnCommentOutput = ReactOnCommentResult | SmartError;

export type ReactOnCommentResult = ChallengeInteractionResult & {
  __typename?: 'ReactOnCommentResult';
  challenge?: Maybe<Challenge>;
  comment?: Maybe<Comment>;
};

export type ReactOnPostInput = {
  postId: Scalars['ID']['input'];
  reaction: ReactionType;
};

export type ReactOnPostOutput = ReactOnPostResult | SmartError;

export type ReactOnPostResult = ChallengeInteractionResult & {
  __typename?: 'ReactOnPostResult';
  challenge?: Maybe<Challenge>;
  post?: Maybe<Post>;
};

export type ReactOnReplyInput = {
  reaction: ReactionType;
  replyId: Scalars['ID']['input'];
};

export type ReactOnReplyOutput = ReactOnReplyResult | SmartError;

export type ReactOnReplyResult = ChallengeInteractionResult & {
  __typename?: 'ReactOnReplyResult';
  challenge?: Maybe<Challenge>;
  reply?: Maybe<Reply>;
};

export enum ReactionType {
  Applaud = 'APPLAUD',
  Like = 'LIKE',
  None = 'NONE',
  Real = 'REAL',
  UnApplaud = 'UN_APPLAUD',
  UnLike = 'UN_LIKE',
  UnReal = 'UN_REAL'
}

export type RealIdFaceData = {
  faceSignature?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
};

export type RealIdFailedVerificationImageData = {
  handGesture?: InputMaybe<RealIdHandGesture>;
  image?: InputMaybe<Scalars['Upload']['input']>;
  isSmiling?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum RealIdHandGesture {
  CrossedFingers = 'CROSSED_FINGERS',
  Fist = 'FIST',
  HangLoose = 'HANG_LOOSE',
  HornFingers = 'HORN_FINGERS',
  Peace = 'PEACE',
  PointFinger = 'POINT_FINGER',
  RaisedHand = 'RAISED_HAND',
  ThumbsDown = 'THUMBS_DOWN',
  ThumbsUp = 'THUMBS_UP'
}

export enum RealIdVerificationStatus {
  PendingReview = 'PENDING_REVIEW',
  ReviewRejected = 'REVIEW_REJECTED',
  Unverified = 'UNVERIFIED',
  Verified = 'VERIFIED'
}

export type RemoveFollowerInput = {
  userId: Scalars['ID']['input'];
};

export type RemoveFollowerOutput = RemoveFollowerResult | SmartError;

export type RemoveFollowerResult = {
  __typename?: 'RemoveFollowerResult';
  currentUser?: Maybe<User>;
};

export type RemoveMemberFromInnerCircleInput = {
  memberId: Scalars['String']['input'];
};

export type RemoveMemberFromListInput = {
  id: Scalars['String']['input'];
  memberId: Scalars['String']['input'];
};

export type RemoveUserAvatarOutput = SmartError | UpdatedUserResult;

export type Reply = Node & {
  __typename?: 'Reply';
  author?: Maybe<User>;
  body?: Maybe<Content>;
  /** @deprecated Use replyContext instead */
  commentReplyContext?: Maybe<CommentReplyContext>;
  id: Scalars['ID']['output'];
  reactionsConnection?: Maybe<ReplyReactionsConnection>;
  replyContext?: Maybe<ReplyContext>;
  replyStats?: Maybe<ReplyStats>;
  ts?: Maybe<Timestamps>;
};


export type ReplyReactionsConnectionArgs = {
  paginationInput: PaginationInput;
  reactionType: ReactionType;
};

export type ReplyContext = {
  __typename?: 'ReplyContext';
  liked?: Maybe<Scalars['Boolean']['output']>;
};

export type ReplyReactionsConnection = {
  __typename?: 'ReplyReactionsConnection';
  count: Scalars['Int']['output'];
  edges?: Maybe<Array<ReplyReactionsEdge>>;
  pageInfo: PageInfo;
};

export type ReplyReactionsEdge = {
  __typename?: 'ReplyReactionsEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type ReplyStats = {
  __typename?: 'ReplyStats';
  likeCount?: Maybe<Scalars['Int']['output']>;
  reportCount?: Maybe<Scalars['Int']['output']>;
};

export type ReportChallengeInput = {
  challengeId: Scalars['ID']['input'];
  type: ReportType;
};

export type ReportChallengeOutput = ReportChallengeResult | SmartError;

export type ReportChallengeResult = {
  __typename?: 'ReportChallengeResult';
  challenge?: Maybe<Challenge>;
};

export type ReportCommentInput = {
  commentId: Scalars['ID']['input'];
  type: ReportType;
};

export type ReportCommentOutput = ReportCommentResult | SmartError;

export type ReportCommentResult = {
  __typename?: 'ReportCommentResult';
  comment?: Maybe<Comment>;
};

export type ReportPostInput = {
  postId: Scalars['ID']['input'];
  type: ReportType;
};

export type ReportPostOutput = ReportPostResult | SmartError;

export type ReportPostResult = {
  __typename?: 'ReportPostResult';
  post?: Maybe<Post>;
};

export type ReportReplyInput = {
  replyId: Scalars['ID']['input'];
  type: ReportType;
};

export type ReportReplyOutput = ReportReplyResult | SmartError;

export type ReportReplyResult = {
  __typename?: 'ReportReplyResult';
  reply?: Maybe<Reply>;
};

export enum ReportType {
  Five = 'FIVE',
  Four = 'FOUR',
  One = 'ONE',
  Three = 'THREE',
  Two = 'TWO',
  Unknown = 'UNKNOWN',
  Unreport = 'UNREPORT'
}

export type ReportUserInput = {
  type: ReportType;
  userId: Scalars['ID']['input'];
};

export type ReportUserOutput = ReportUserResult | SmartError;

export type ReportUserResult = {
  __typename?: 'ReportUserResult';
  user?: Maybe<User>;
};

export enum RepostAccess {
  Everyone = 'EVERYONE',
  Followers = 'FOLLOWERS',
  InnerCircle = 'INNER_CIRCLE',
  List = 'LIST',
  None = 'NONE'
}

export type RepostAccessControlContext = {
  __typename?: 'RepostAccessControlContext';
  canRepost?: Maybe<Scalars['Boolean']['output']>;
  cannotRepostErrorMessage?: Maybe<Scalars['String']['output']>;
  hasReposted?: Maybe<Scalars['Boolean']['output']>;
};

export type RepostAccessData = {
  access: RepostAccess;
  listIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type RepostInput = {
  accessControl?: InputMaybe<PostAccessControl>;
  caption?: InputMaybe<ContentInput>;
  expirationHourCount?: InputMaybe<Scalars['Int']['input']>;
  negativeIndices?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  negativeResults?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  postId: Scalars['ID']['input'];
  shouldBypassTrollDetection?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RepostMeta = {
  __typename?: 'RepostMeta';
  count?: Maybe<Scalars['Int']['output']>;
  isParentPostDeleted?: Maybe<Scalars['Boolean']['output']>;
  parentPost?: Maybe<Post>;
  repostedPosts?: Maybe<RepostedPostsList>;
};

export type RepostOutput = RepostResult | SmartError | TrollDetectorError;

export type RepostResult = {
  __typename?: 'RepostResult';
  post?: Maybe<Post>;
};

export type RepostedPostsEdge = {
  __typename?: 'RepostedPostsEdge';
  cursor: Scalars['String']['output'];
  node: Post;
};

export type RepostedPostsList = {
  __typename?: 'RepostedPostsList';
  edges?: Maybe<Array<RepostedPostsEdge>>;
  pageInfo: PageInfo;
};

export type RequestDeleteUserOutput = RequestDeleteUserResult | SmartError;

export type RequestDeleteUserResult = {
  __typename?: 'RequestDeleteUserResult';
  deleteRequestAccepted: Scalars['Boolean']['output'];
};

export type ReviewReportRequest = {
  __typename?: 'ReviewReportRequest';
  comment?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Timestamp']['output']>;
  id: Scalars['ID']['output'];
  link?: Maybe<Scalars['String']['output']>;
  readableId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Timestamp']['output']>;
  violatedGuideline?: Maybe<ViolatedGuideline>;
};

export type SearchEdge = {
  __typename?: 'SearchEdge';
  cursor: Scalars['String']['output'];
  node: SearchNode;
};

export type SearchInput = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  mode?: InputMaybe<SearchMode>;
  objectType?: InputMaybe<ObjectType>;
  query?: InputMaybe<Scalars['String']['input']>;
};

export enum SearchMode {
  FullText = 'FULL_TEXT',
  Prefix = 'PREFIX'
}

export type SearchNode = Tag | User;

export type SearchOutput = SearchResult | SmartError;

export type SearchResult = {
  __typename?: 'SearchResult';
  objectType?: Maybe<ObjectType>;
  pageInfo: PageInfo;
  result?: Maybe<Array<SearchEdge>>;
};

export type SegmentPositionInput = {
  position?: InputMaybe<Scalars['Int']['input']>;
  segmentType?: InputMaybe<SegmentType>;
};

export enum SegmentType {
  Tag = 'TAG',
  Text = 'TEXT',
  User = 'USER'
}

export type SendContactUsEmailInput = {
  /** The body of the email */
  body: Scalars['String']['input'];
  /**
   * The email address of the user sending the email in order to contact them back
   * and identify them.
   */
  from: Scalars['String']['input'];
  /** The name of the user sending the request in order to contact them back. */
  name: Scalars['String']['input'];
  /** The subject line of the email, this will be prefixed with 'Contact Us: ' */
  subject: Scalars['String']['input'];
};

export type SendContactUsEmailOutput = SendContactUsEmailResult | SmartError;

export type SendContactUsEmailResult = {
  __typename?: 'SendContactUsEmailResult';
  success: Scalars['Boolean']['output'];
};

export type SendEmailVerificationOutput = SendEmailVerificationResult | SmartError;

export type SendEmailVerificationResult = {
  __typename?: 'SendEmailVerificationResult';
  isSuccessful?: Maybe<Scalars['Boolean']['output']>;
};

export enum SensitiveStatus {
  Nsfw = 'NSFW'
}

export type SharePostInput = {
  postId: Scalars['ID']['input'];
};

export type SharePostOutput = {
  __typename?: 'SharePostOutput';
  post?: Maybe<Post>;
};

export type SignUpOutput = {
  __typename?: 'SignUpOutput';
  jwtToken?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type SignUpWithEmailInput = {
  avatarImage?: InputMaybe<MediaSourceInput>;
  fcmToken: Scalars['String']['input'];
  gender: Gender;
  handle: Scalars['String']['input'];
  inviteCode?: InputMaybe<Scalars['Int']['input']>;
  langCode: Scalars['String']['input'];
  linkData?: InputMaybe<LinkData>;
  name: Scalars['String']['input'];
};

export type SignUpWithPhoneNumberInput = {
  avatarImage?: InputMaybe<MediaSourceInput>;
  fcmToken: Scalars['String']['input'];
  gender?: InputMaybe<Gender>;
  handle: Scalars['String']['input'];
  inviteCode?: InputMaybe<Scalars['Int']['input']>;
  linkData?: InputMaybe<LinkData>;
  name: Scalars['String']['input'];
};

export type SkipBannerInput = {
  bannerId: Scalars['ID']['input'];
};

export type SkipBannerOutput = SkipBannerResult | SmartError;

export type SkipBannerResult = {
  __typename?: 'SkipBannerResult';
  success: Scalars['Boolean']['output'];
};

export type SmartError = Error & {
  __typename?: 'SmartError';
  message: Scalars['String']['output'];
};

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  noSpace?: Maybe<Scalars['Boolean']['output']>;
};

export type TagConnection = {
  __typename?: 'TagConnection';
  edges?: Maybe<Array<TagEdge>>;
  pageInfo: PageInfo;
};

export type TagEdge = {
  __typename?: 'TagEdge';
  cursor: Scalars['String']['output'];
  node: Tag;
};

export type TagInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  noSpace?: InputMaybe<Scalars['Boolean']['input']>;
};

export type TagSegmentInput = {
  position?: InputMaybe<Scalars['Int']['input']>;
  tag?: InputMaybe<TagInput>;
};

export type Text = {
  __typename?: 'Text';
  chunk?: Maybe<Scalars['String']['output']>;
  lang?: Maybe<Language>;
  noSpace?: Maybe<Scalars['Boolean']['output']>;
};

export type TextInput = {
  chunk?: InputMaybe<Scalars['String']['input']>;
  langCode?: InputMaybe<Scalars['String']['input']>;
  noSpace?: InputMaybe<Scalars['Boolean']['input']>;
};

export type TextPost = FeedEntry & Node & Post & {
  __typename?: 'TextPost';
  accessControl?: Maybe<PostAccessControlData>;
  accessControlContext?: Maybe<PostAccessControlContext>;
  applaudReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  author?: Maybe<User>;
  baseType?: Maybe<PostBaseType>;
  canComment?: Maybe<Scalars['Boolean']['output']>;
  commentPostingAccessControlContext?: Maybe<CommentPostingAccessControlContext>;
  commentVisibilityAccessControlContext?: Maybe<CommentVisibilityAccessControlContext>;
  commentsConnection?: Maybe<PostCommentsConnection>;
  content?: Maybe<Content>;
  id: Scalars['ID']['output'];
  isHiddenOnChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPinnedToChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  likeReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  parentChallengeId?: Maybe<Scalars['ID']['output']>;
  pinnedComment?: Maybe<Comment>;
  postContext?: Maybe<PostContext>;
  realReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  repostAccessControlContext?: Maybe<RepostAccessControlContext>;
  sensitiveStatus?: Maybe<SensitiveStatus>;
  stats?: Maybe<PostStats>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  ts?: Maybe<Timestamps>;
  willBeDeleted?: Maybe<Scalars['Boolean']['output']>;
};


export type TextPostApplaudReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type TextPostCommentsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includingAndAfter?: InputMaybe<Scalars['String']['input']>;
  includingAndBefore?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
  targetCommentId?: InputMaybe<Scalars['ID']['input']>;
};


export type TextPostLikeReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type TextPostRealReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};

export type TextPostProperties = {
  __typename?: 'TextPostProperties';
  content?: Maybe<Content>;
};

export type TextPostPropertiesInput = {
  content?: InputMaybe<ContentInput>;
};

export type TextSegmentInput = {
  position?: InputMaybe<Scalars['Int']['input']>;
  text?: InputMaybe<TextInput>;
};

export type Timestamps = {
  __typename?: 'Timestamps';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  expiry?: Maybe<Scalars['DateTime']['output']>;
  start?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type Transaction = {
  __typename?: 'Transaction';
  amount: Scalars['Int']['output'];
  history?: Maybe<Array<TransactionHistoryEvent>>;
  id: Scalars['ID']['output'];
  recipient: User;
  sender: TransactionSender;
  status: TransactionStatus;
  type: TransactionType;
};

export type TransactionEdge = {
  __typename?: 'TransactionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

export type TransactionFailureDetails = {
  __typename?: 'TransactionFailureDetails';
  message: Scalars['String']['output'];
  reason: TransactionFailureReason;
};

export enum TransactionFailureReason {
  InternalError = 'INTERNAL_ERROR'
}

export enum TransactionFilter {
  Award = 'AWARD'
}

export type TransactionHistoryEvent = {
  __typename?: 'TransactionHistoryEvent';
  createdAt: Scalars['DateTime']['output'];
  failureDetails?: Maybe<TransactionFailureDetails>;
  status: TransactionStatus;
};

export type TransactionSender = User | WildrBot;

export enum TransactionStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type TransactionType = AwardTransactionType;

export type TransactionsConnection = {
  __typename?: 'TransactionsConnection';
  edges?: Maybe<Array<TransactionEdge>>;
  pageInfo: PageInfo;
};

export type TransactionsConnectionInput = {
  paginationInput: PaginationInput;
  transactionFilter: TransactionFilter;
};

export type TrollDetectionOverride = {
  description?: InputMaybe<TrollDetectionOverrideData>;
  name?: InputMaybe<TrollDetectionOverrideData>;
};

export type TrollDetectionOverrideData = {
  message?: InputMaybe<Scalars['String']['input']>;
  result?: InputMaybe<Scalars['String']['input']>;
};

export type TrollDetectorError = Error & {
  __typename?: 'TrollDetectorError';
  data?: Maybe<Scalars['String']['output']>;
  indices?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  message: Scalars['String']['output'];
  results?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type UnPinCommentOnChallengeInput = {
  challengeId: Scalars['ID']['input'];
};

export type UnPinCommentOnChallengeOutput = SmartError | UnPinCommentOnChallengeResult;

export type UnPinCommentOnChallengeResult = {
  __typename?: 'UnPinCommentOnChallengeResult';
  challenge?: Maybe<Challenge>;
};

export type UnblockUserInput = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type UnblockUserOutput = SmartError | UnblockUserResult;

export type UnblockUserResult = {
  __typename?: 'UnblockUserResult';
  isSuccessful: Scalars['Boolean']['output'];
};

export type UnfollowUserInput = {
  userId: Scalars['ID']['input'];
};

export type UnfollowUserOutput = SmartError | UnfollowUserResult;

export type UnfollowUserResult = {
  __typename?: 'UnfollowUserResult';
  currentUser?: Maybe<User>;
};

export type UpdateBioInput = {
  bio: Scalars['String']['input'];
};

export type UpdateBioOutput = SmartError | UpdatedUserResult;

export type UpdateCategoryInterestsInput = {
  categoryIds: Array<Scalars['String']['input']>;
};

export type UpdateCategoryInterestsOutput = SmartError | UpdateCategoryInterestsResult;

export type UpdateCategoryInterestsResult = {
  __typename?: 'UpdateCategoryInterestsResult';
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type UpdateCommentParticipationError = Error & {
  __typename?: 'UpdateCommentParticipationError';
  message: Scalars['String']['output'];
};

export type UpdateCommentParticipationInput = {
  commentId?: InputMaybe<Scalars['ID']['input']>;
  type?: InputMaybe<ParticipationType>;
};

export type UpdateCommentParticipationOutput = SmartError | UpdateCommentParticipationError | UpdateCommentParticipationResult;

export type UpdateCommentParticipationResult = {
  __typename?: 'UpdateCommentParticipationResult';
  comment?: Maybe<Comment>;
};

export type UpdateEmailInput = {
  email: Scalars['String']['input'];
};

export type UpdateEmailOutput = SmartError | UpdatedUserResult;

export type UpdateFcmTokenInput = {
  token: Scalars['String']['input'];
};

export type UpdateFcmTokenOutput = SmartError | UpdateFcmTokenStatus;

export type UpdateFcmTokenStatus = {
  __typename?: 'UpdateFCMTokenStatus';
  success: Scalars['Boolean']['output'];
};

export type UpdateHandleInput = {
  handle: Scalars['String']['input'];
};

export type UpdateHandleOutput = SmartError | UpdatedUserResult;

export type UpdateLastSeenCursorInput = {
  endCursor: Scalars['String']['input'];
  feedType?: InputMaybe<FeedType>;
  isRefresh?: InputMaybe<Scalars['Boolean']['input']>;
  postType?: InputMaybe<PostKind>;
  scopeType?: InputMaybe<FeedScopeType>;
  timestamp: Scalars['String']['input'];
};

export type UpdateLastSeenCursorOutput = {
  __typename?: 'UpdateLastSeenCursorOutput';
  isSuccessful: Scalars['Boolean']['output'];
};

export type UpdateListResult = {
  __typename?: 'UpdateListResult';
  listDetails?: Maybe<UserList>;
  owner?: Maybe<User>;
};

export type UpdateListVisibilityInput = {
  follower: UserListVisibility;
  following: UserListVisibility;
};

export type UpdateListVisibilityOutput = SmartError | UpdateListVisibilityResult;

export type UpdateListVisibilityResult = {
  __typename?: 'UpdateListVisibilityResult';
  isSuccessful: Scalars['Boolean']['output'];
  user?: Maybe<User>;
};

export type UpdateMemberListOutput = SmartError | UpdateListResult;

export type UpdateNameInput = {
  name: Scalars['String']['input'];
};

export type UpdateNameOutput = SmartError | UpdatedUserResult;

export type UpdateOnboardingInput = {
  type: OnboardingType;
};

export type UpdatePhoneNumberInput = {
  phoneNumber: Scalars['String']['input'];
};

export type UpdatePhoneNumberOutput = SmartError | UpdatedUserResult;

export type UpdatePostTypeInterestsInput = {
  postTypes: Array<Scalars['String']['input']>;
};

export type UpdatePostTypeInterestsOutput = SmartError | UpdatePostTypeInterestsResult;

export type UpdatePostTypeInterestsResult = {
  __typename?: 'UpdatePostTypeInterestsResult';
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type UpdatePronounInput = {
  pronoun: Scalars['String']['input'];
};

export type UpdatePronounOutput = SmartError | UpdatedUserResult;

export type UpdateRealIdVerificationInput = {
  faceData: RealIdFaceData;
  faceImage: Scalars['Upload']['input'];
  passFailState: PassFailState;
  realIdFailedVerificationImageData?: InputMaybe<Array<InputMaybe<RealIdFailedVerificationImageData>>>;
};

export type UpdateRealIdVerificationOutput = SmartError | UpdateRealIdVerificationResult;

export type UpdateRealIdVerificationResult = {
  __typename?: 'UpdateRealIdVerificationResult';
  message: Scalars['String']['output'];
};

export type UpdateUserAvatarInput = {
  image: Scalars['Upload']['input'];
};

export type UpdateUserAvatarOutput = SmartError | UpdatedUserResult;

export type UpdatedUserResult = {
  __typename?: 'UpdatedUserResult';
  updatedUser?: Maybe<User>;
};

export type UploadImageInput = {
  image: Scalars['Upload']['input'];
};

export type UploadImageOutput = {
  __typename?: 'UploadImageOutput';
  id: Scalars['ID']['output'];
};

export type UploadVideoInput = {
  video: Scalars['Upload']['input'];
};

export type UploadVideoOutput = {
  __typename?: 'UploadVideoOutput';
  id: Scalars['ID']['output'];
};

export type User = {
  __typename?: 'User';
  activitiesConnection?: Maybe<ActivitiesConnection>;
  allCreatedLists?: Maybe<UserLists>;
  avatarImage?: Maybe<MediaSource>;
  bio?: Maybe<Scalars['String']['output']>;
  blockList?: Maybe<BlockedUsersList>;
  commentEnabledAt?: Maybe<Scalars['DateTime']['output']>;
  commentOnboardedAt?: Maybe<Scalars['DateTime']['output']>;
  currentUserContext?: Maybe<UserContext>;
  email?: Maybe<Scalars['String']['output']>;
  embargoExpirationDaysDelta?: Maybe<Scalars['Int']['output']>;
  followersList?: Maybe<UserFollowersList>;
  followingsList?: Maybe<UserFollowingsList>;
  gender?: Maybe<Gender>;
  handle?: Maybe<Scalars['String']['output']>;
  hasBlocked?: Maybe<Scalars['Boolean']['output']>;
  hasPersonalizedFeed?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  innerCircleList?: Maybe<UserListWithMembers>;
  invitesConnection?: Maybe<InvitesConnection>;
  isAvailable?: Maybe<Scalars['Boolean']['output']>;
  isSuspended?: Maybe<Scalars['Boolean']['output']>;
  links?: Maybe<UserLinks>;
  name?: Maybe<Scalars['String']['output']>;
  onboardingStats?: Maybe<OnboardingStats>;
  password?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  postsConnection?: Maybe<UserPostsConnection>;
  pronoun?: Maybe<Scalars['String']['output']>;
  realIdFace?: Maybe<MediaSource>;
  realIdVerificationStatus?: Maybe<RealIdVerificationStatus>;
  remainingInvitesCount?: Maybe<Scalars['Int']['output']>;
  score?: Maybe<Scalars['Float']['output']>;
  singleList?: Maybe<UserListWithMembers>;
  stats?: Maybe<UserStats>;
  strikeData?: Maybe<UserStrikeData>;
  ts?: Maybe<Timestamps>;
  userCreatedAt?: Maybe<Scalars['DateTime']['output']>;
  visibilityPreferences?: Maybe<VisibilityPreferences>;
  wallet?: Maybe<Wallet>;
};


export type UserActivitiesConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};


export type UserAllCreatedListsArgs = {
  paginationInput?: InputMaybe<PaginationInput>;
};


export type UserBlockListArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};


export type UserFollowersListArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};


export type UserFollowingsListArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};


export type UserInnerCircleListArgs = {
  isSuggestion?: InputMaybe<Scalars['Boolean']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};


export type UserInvitesConnectionArgs = {
  input?: InputMaybe<InvitesConnectionInput>;
};


export type UserPostsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};


export type UserSingleListArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
  paginationInput?: InputMaybe<PaginationInput>;
};

export type UserConnection = {
  __typename?: 'UserConnection';
  edges?: Maybe<Array<UserEdge>>;
  pageInfo: PageInfo;
};

export type UserContext = {
  __typename?: 'UserContext';
  followingUser?: Maybe<Scalars['Boolean']['output']>;
  isInnerCircle?: Maybe<Scalars['Boolean']['output']>;
};

export type UserEdge = {
  __typename?: 'UserEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserFollowersEdge = {
  __typename?: 'UserFollowersEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserFollowersList = {
  __typename?: 'UserFollowersList';
  edges?: Maybe<Array<UserFollowersEdge>>;
  pageInfo: PageInfo;
};

export type UserFollowingsEdge = {
  __typename?: 'UserFollowingsEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserFollowingsList = {
  __typename?: 'UserFollowingsList';
  edges?: Maybe<Array<UserFollowingsEdge>>;
  pageInfo: PageInfo;
};

export type UserInput = {
  avatarImage?: InputMaybe<MediaSourceInput>;
  email?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  handle?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UserLinks = {
  __typename?: 'UserLinks';
  innerCircleInviteLink: Scalars['String']['output'];
  inviteLink: Scalars['String']['output'];
};

export type UserList = {
  __typename?: 'UserList';
  iconUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  memberCount?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type UserListMembersEdge = {
  __typename?: 'UserListMembersEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type UserListMembersList = {
  __typename?: 'UserListMembersList';
  edges?: Maybe<Array<UserListMembersEdge>>;
  pageInfo: PageInfo;
};

export enum UserListVisibility {
  Author = 'AUTHOR',
  Everyone = 'EVERYONE',
  Followers = 'FOLLOWERS',
  InnerCircle = 'INNER_CIRCLE',
  None = 'NONE'
}

export type UserListWithMembers = {
  __typename?: 'UserListWithMembers';
  details?: Maybe<UserList>;
  isSuggestion?: Maybe<Scalars['Boolean']['output']>;
  members?: Maybe<UserListMembersList>;
};

export type UserLists = {
  __typename?: 'UserLists';
  edges?: Maybe<Array<UserListsEdge>>;
  pageInfo: PageInfo;
};

export type UserListsEdge = {
  __typename?: 'UserListsEdge';
  cursor: Scalars['String']['output'];
  node: UserList;
};

export type UserMention = {
  __typename?: 'UserMention';
  User?: Maybe<UserRef>;
  id: Scalars['ID']['output'];
};

export type UserPostsConnection = {
  __typename?: 'UserPostsConnection';
  edges?: Maybe<Array<UserPostsEdge>>;
  pageInfo: PageInfo;
};

export type UserPostsEdge = {
  __typename?: 'UserPostsEdge';
  cursor: Scalars['String']['output'];
  node: Post;
};

export type UserRef = {
  __typename?: 'UserRef';
  handle?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
};

export type UserSegmentInput = {
  position?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export type UserStats = {
  __typename?: 'UserStats';
  createdChallengesCount?: Maybe<Scalars['Int']['output']>;
  followerCount?: Maybe<Scalars['Int']['output']>;
  followingCount?: Maybe<Scalars['Int']['output']>;
  innerCircleCount?: Maybe<Scalars['Int']['output']>;
  joinedChallengesCount?: Maybe<Scalars['Int']['output']>;
  postCount?: Maybe<Scalars['Int']['output']>;
};

export type UserStrikeData = {
  __typename?: 'UserStrikeData';
  currentStrikeCount?: Maybe<Scalars['Int']['output']>;
  finalStrikeTimeStamps?: Maybe<Array<Maybe<Scalars['DateTime']['output']>>>;
  firstStrikeCount?: Maybe<Scalars['Int']['output']>;
  firstStrikeExpiryTS?: Maybe<Scalars['DateTime']['output']>;
  firstStrikeTS?: Maybe<Scalars['DateTime']['output']>;
  isFaded?: Maybe<Scalars['Boolean']['output']>;
  permanentSuspensionCount?: Maybe<Scalars['Int']['output']>;
  score?: Maybe<Scalars['Float']['output']>;
  secondStrikeCount?: Maybe<Scalars['Int']['output']>;
  secondStrikeExpiryTS?: Maybe<Scalars['DateTime']['output']>;
  secondStrikeTS?: Maybe<Scalars['DateTime']['output']>;
  thirdStrikeCount?: Maybe<Scalars['Int']['output']>;
  thirdStrikeExpiryTS?: Maybe<Scalars['DateTime']['output']>;
  thirdStrikeTS?: Maybe<Scalars['DateTime']['output']>;
};

export type UsersListEdge = {
  __typename?: 'UsersListEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type Video = {
  __typename?: 'Video';
  id: Scalars['ID']['output'];
  source?: Maybe<MediaSource>;
  type?: Maybe<VideoType>;
};

export type VideoPost = FeedEntry & Node & Post & {
  __typename?: 'VideoPost';
  accessControl?: Maybe<PostAccessControlData>;
  accessControlContext?: Maybe<PostAccessControlContext>;
  applaudReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  author?: Maybe<User>;
  baseType?: Maybe<PostBaseType>;
  canComment?: Maybe<Scalars['Boolean']['output']>;
  caption?: Maybe<Content>;
  commentPostingAccessControlContext?: Maybe<CommentPostingAccessControlContext>;
  commentVisibilityAccessControlContext?: Maybe<CommentVisibilityAccessControlContext>;
  commentsConnection?: Maybe<PostCommentsConnection>;
  id: Scalars['ID']['output'];
  isHiddenOnChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPinnedToChallenge?: Maybe<Scalars['Boolean']['output']>;
  isPrivate?: Maybe<Scalars['Boolean']['output']>;
  likeReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  parentChallengeId?: Maybe<Scalars['ID']['output']>;
  pinnedComment?: Maybe<Comment>;
  postContext?: Maybe<PostContext>;
  realReactorsUserListConnection?: Maybe<PostReactorsListConnection>;
  repostAccessControlContext?: Maybe<RepostAccessControlContext>;
  sensitiveStatus?: Maybe<SensitiveStatus>;
  stats?: Maybe<PostStats>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  thumbnail?: Maybe<Image>;
  ts?: Maybe<Timestamps>;
  video?: Maybe<Video>;
  willBeDeleted?: Maybe<Scalars['Boolean']['output']>;
};


export type VideoPostApplaudReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type VideoPostCommentsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includingAndAfter?: InputMaybe<Scalars['String']['input']>;
  includingAndBefore?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
  targetCommentId?: InputMaybe<Scalars['ID']['input']>;
};


export type VideoPostLikeReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};


export type VideoPostRealReactorsUserListConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  postId: Scalars['ID']['input'];
};

export type VideoPostProperties = {
  __typename?: 'VideoPostProperties';
  thumbnail?: Maybe<Image>;
  video?: Maybe<Video>;
};

export type VideoPostPropertiesInput = {
  thumbnail?: InputMaybe<Scalars['Upload']['input']>;
  video: Scalars['Upload']['input'];
};

export enum VideoType {
  Mov = 'MOV',
  Mp4 = 'MP4'
}

export enum ViolatedGuideline {
  AdultNudityAndSexualActivities = 'ADULT_NUDITY_AND_SEXUAL_ACTIVITIES',
  CriminalActivities = 'CRIMINAL_ACTIVITIES',
  DangerousActs = 'DANGEROUS_ACTS',
  DangerousIndividualsAndOrganizations = 'DANGEROUS_INDIVIDUALS_AND_ORGANIZATIONS',
  DrugsControlledSubstancesAlcoholAndTobacco = 'DRUGS_CONTROLLED_SUBSTANCES_ALCOHOL_AND_TOBACCO',
  FraudsAndScams = 'FRAUDS_AND_SCAMS',
  Gambling = 'GAMBLING',
  HatefulBehavior = 'HATEFUL_BEHAVIOR',
  IllegalActivitiesAndRegulatedGoods = 'ILLEGAL_ACTIVITIES_AND_REGULATED_GOODS',
  IntegrityAndAuthenticity = 'INTEGRITY_AND_AUTHENTICITY',
  Introduction = 'INTRODUCTION',
  MinorSafety = 'MINOR_SAFETY',
  None = 'NONE',
  NudityAndSexualActivityInvolvingAdults = 'NUDITY_AND_SEXUAL_ACTIVITY_INVOLVING_ADULTS',
  PlatformSecurity = 'PLATFORM_SECURITY',
  PrivacyPersonalDataAndPersonallyIdentifiableInformationPii = 'PRIVACY_PERSONAL_DATA_AND_PERSONALLY_IDENTIFIABLE_INFORMATION_PII',
  SelfHarmAndEatingDisorders = 'SELF_HARM_AND_EATING_DISORDERS',
  SexualExploitation = 'SEXUAL_EXPLOITATION',
  SexualHarassment = 'SEXUAL_HARASSMENT',
  Suicide = 'SUICIDE',
  SuicideSelfHarmAndDangerousActs = 'SUICIDE_SELF_HARM_AND_DANGEROUS_ACTS',
  ThreatsAndIncitementToViolence = 'THREATS_AND_INCITEMENT_TO_VIOLENCE',
  ThreatsOfHackingDoxxingAndBlackmail = 'THREATS_OF_HACKING_DOXXING_AND_BLACKMAIL',
  TrollingAndAbusiveBehavior = 'TROLLING_AND_ABUSIVE_BEHAVIOR',
  TrollingHarassmentAndBullying = 'TROLLING_HARASSMENT_AND_BULLYING',
  ViolentAndGraphicContent = 'VIOLENT_AND_GRAPHIC_CONTENT',
  ViolentExtremism = 'VIOLENT_EXTREMISM',
  Weapons = 'WEAPONS'
}

export type VisibilityPreferences = {
  __typename?: 'VisibilityPreferences';
  list?: Maybe<ListVisibility>;
};

export enum WaitlistType {
  Wildrcoin = 'WILDRCOIN'
}

export type Wallet = {
  __typename?: 'Wallet';
  balances: WalletBalances;
  id: Scalars['ID']['output'];
  transactionsConnection?: Maybe<TransactionsConnection>;
  walletActivitiesConnection?: Maybe<WalletActivitiesConnection>;
};


export type WalletTransactionsConnectionArgs = {
  input?: InputMaybe<TransactionsConnectionInput>;
};


export type WalletWalletActivitiesConnectionArgs = {
  paginationInput?: InputMaybe<WalletActivitiesConnectionInput>;
};

export type WalletActivitiesConnection = {
  __typename?: 'WalletActivitiesConnection';
  edges?: Maybe<Array<WalletActivityEdge>>;
  pageInfo: PageInfo;
};

export type WalletActivitiesConnectionInput = {
  paginationInput: PaginationInput;
};

export type WalletActivity = Node & {
  __typename?: 'WalletActivity';
  asset: Image;
  displayStr: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  route: PageRoute;
};

export type WalletActivityEdge = {
  __typename?: 'WalletActivityEdge';
  cursor: Scalars['String']['output'];
  node: WalletActivity;
};

export type WalletBalances = {
  __typename?: 'WalletBalances';
  available: Scalars['Int']['output'];
  current: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
};

export type WalletNestedRoute = WalletTransactionNestedRoute;

export type WalletPageRoute = {
  __typename?: 'WalletPageRoute';
  nestedRoute?: Maybe<WalletNestedRoute>;
  walletId?: Maybe<Scalars['ID']['output']>;
};

export type WalletTransactionNestedRoute = {
  __typename?: 'WalletTransactionNestedRoute';
  transactionId: Scalars['ID']['output'];
};

export type WildrAppConfig = {
  __typename?: 'WildrAppConfig';
  appVersion?: Maybe<WildrAppVersion>;
};

export type WildrAppConfigInput = {
  osName?: InputMaybe<OsName>;
};

export type WildrAppConfigOutput = SmartError | WildrAppConfig;

export type WildrAppVersion = {
  __typename?: 'WildrAppVersion';
  latest?: Maybe<Scalars['String']['output']>;
  mandatory?: Maybe<Scalars['String']['output']>;
};

export type WildrBot = {
  __typename?: 'WildrBot';
  handle: Scalars['String']['output'];
};

export type WildrVerifiedManualReviewInput = {
  faceImage: Scalars['Upload']['input'];
  manualReviewImage: Scalars['Upload']['input'];
};

export type WildrVerifiedManualReviewOutput = SmartError | WildrVerifiedManualReviewResult;

export type WildrVerifiedManualReviewResult = {
  __typename?: 'WildrVerifiedManualReviewResult';
  message: Scalars['String']['output'];
};

export type SendContactUsEmailMutationVariables = Exact<{
  input: SendContactUsEmailInput;
}>;


export type SendContactUsEmailMutation = { __typename?: 'Mutation', sendContactUsEmail: { __typename: 'SendContactUsEmailResult', success: boolean } | { __typename: 'SmartError', message: string } };

export type AddEmailToWaitlistMutationVariables = Exact<{
  input: AddEmailToWaitlistInput;
}>;


export type AddEmailToWaitlistMutation = { __typename?: 'Mutation', addEmailToWaitlist: { __typename?: 'AddEmailToWaitlistResult', success: boolean } | { __typename?: 'SmartError', message: string } };

export type GetWebAppFeatureFlagsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWebAppFeatureFlagsQuery = { __typename?: 'Query', getWebAppFeatureFlags: { __typename?: 'GetWebAppFeatureFlagsResult', wildrCoinWaitlistEnabled: boolean } | { __typename?: 'SmartError' } };


export const SendContactUsEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendContactUsEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendContactUsEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendContactUsEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SendContactUsEmailResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SmartError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<SendContactUsEmailMutation, SendContactUsEmailMutationVariables>;
export const AddEmailToWaitlistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddEmailToWaitlist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddEmailToWaitlistInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addEmailToWaitlist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AddEmailToWaitlistResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SmartError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<AddEmailToWaitlistMutation, AddEmailToWaitlistMutationVariables>;
export const GetWebAppFeatureFlagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getWebAppFeatureFlags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWebAppFeatureFlags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GetWebAppFeatureFlagsResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wildrCoinWaitlistEnabled"}}]}}]}}]}}]} as unknown as DocumentNode<GetWebAppFeatureFlagsQuery, GetWebAppFeatureFlagsQueryVariables>;