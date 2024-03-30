// Note: Order of validator matters in the annotation.
// Validators are evaluated in reverse order of specification on the property.
// import { FileUpload, GraphQLUpload } from 'graphql-upload'
import { ArgsType } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  AddCommentResult,
  AskForHandleAndNameError,
  Challenge,
  ChallengeCoverEnum,
  CommentRepliesConnection,
  CommenterScope,
  ESResult,
  ESearchType,
  FeedType,
  Gender,
  GetOrDeleteFirebaseUserOutput,
  AddCommentInput as GqlAddCommentInput,
  AddReplyInput as GqlAddReplyInput,
  AddReplyResult as GqlAddReplyResult,
  BlockedUsersEdge as GqlBlockedUsersEdge,
  BlockedUsersList as GqlBlockedUsersList,
  ChallengeCoverImageInput as GqlChallengeCoverImageInput,
  CommentStats as GqlCommentStats,
  Content as GqlContent,
  ContentInput as GqlContentInput,
  CreateChallengeInput as GqlCreateChallengeInput,
  CreateImagePostInput as GqlCreateImagePostInput,
  CreateTextPostInput as GqlCreateTextPostInput,
  CreateVideoPostInput as GqlCreateVideoPostInput,
  DeleteCommentInput as GqlDeleteCommentInput,
  DeleteCommentResult as GqlDeleteCommentResult,
  DeleteReplyInput as GqlDeleteReplyInput,
  DeleteReplyResult as GqlDeleteReplyResult,
  ESInput as GqlESInput,
  EditChallengeInput as GqlEditChallengeInput,
  FirebaseAuthEmailInput as GqlFirebaseAuthEmailInput,
  FirebaseAuthPhoneNumberInput as GqlFirebaseAuthPhoneNumberInput,
  FirebaseSignupInput as GqlFirebaseSignupInput,
  FollowUserInput as GqlFollowUserInput,
  FollowUserResult as GqlFollowUserResult,
  GetCommentInput as GqlGetCommentInput,
  GetFeedInput as GqlGetFeedInput,
  GetFollowersListInput as GqlGetFollowersListInput,
  GetFollowersListResult as GqlGetFollowersListResult,
  GetPostInput as GqlGetPostInput,
  GetUserInput as GqlGetUserInput,
  ImagePostPropertiesInput as GqlImagePostPropertiesInput,
  LoginOutput as GqlLoginOutput,
  MediaSourceInput as GqlMediaSourceInput,
  CreateMultiMediaPostInput as GqlMultiMediaPostInput,
  PinCommentInput as GqlPinCommentInput,
  PinCommentResult as GqlPinCommentResult,
  Post as GqlPost,
  PostCommentsConnection as GqlPostCommentsConnection,
  PostContext as GqlPostContext,
  PostStats as GqlPostStats,
  ReactOnCommentInput as GqlReactOnCommentInput,
  ReportCommentInput as GqlReportCommentInput,
  ReportCommentResult as GqlReportCommentResult,
  ReportPostInput as GqlReportPostInput,
  ReportPostResult as GqlReportPostResult,
  ReportReplyInput as GqlReportReplyInput,
  ReportReplyResult as GqlReportReplyResult,
  RepostInput as GqlRepostInput,
  SearchInput as GqlSearchInput,
  SegmentPositionInput as GqlSegmentPositionInput,
  SendContactUsEmailInput as GqlSendContactUsEmailInput,
  SharePostInput as GqlSharePostInput,
  SignUpOutput as GqlSignUpOutput,
  SignUpWithEmailInput as GqlSignUpWithEmailInput,
  SignUpWithPhoneNumberInput as GqlSignUpWithPhoneNumberInput,
  TagInput as GqlTagInput,
  TagSegmentInput as GqlTagSegmentInput,
  TextInput as GqlTextInput,
  TextPostPropertiesInput as GqlTextPostPropertiesInput,
  TextSegmentInput as GqlTextSegmentInput,
  UnfollowUserInput as GqlUnfollowUserInput,
  UnfollowUserResult as GqlUnfollowUserResult,
  UpdateCommentParticipationError as GqlUpdateCommentParticipationError,
  UpdateCommentParticipationInput as GqlUpdateCommentParticipationInput,
  UpdateCommentParticipationResult as GqlUpdateCommentParticipationResult,
  UploadImageInput as GqlUploadImageInput,
  UploadVideoInput as GqlUploadVideoInput,
  User as GqlUser,
  UserContext as GqlUserContext,
  UserFollowersEdge as GqlUserFollowersEdge,
  UserFollowersList as GqlUserFollowersList,
  UserFollowingsEdge as GqlUserFollowingsEdge,
  UserFollowingsList as GqlUserFollowingsList,
  UserInput as GqlUserInput,
  UserPostsConnection as GqlUserPostsConnection,
  UserPostsEdge as GqlUserPostsEdge,
  UserSegmentInput as GqlUserSegmentInput,
  UserStats as GqlUserStats,
  VideoPostPropertiesInput as GqlVideoPostPropertiesInput,
  WildrVerifiedManualReviewInput as GqlWildrVerifiedManualReviewInput,
  HandleAlreadyTakenError,
  ImageType,
  ObjectType,
  PageInfo,
  ParticipationType,
  PassFailState,
  PostAccessControl,
  PostBaseType,
  PostKind,
  PostNotFoundError,
  PostProperties,
  PostVisibility,
  ReactionType,
  RealIdHandGesture,
  RepostMeta,
  SearchMode,
  SegmentType,
  SensitiveStatus,
  SmartError,
  Text,
  TrollDetectorError,
  VideoType,
} from './generated-graphql';

export {
  FeedType,
  Gender,
  ImageType,
  ObjectType,
  ParticipationType,
  PostKind,
  ReactionType,
  SearchMode,
  SegmentType,
  Text,
  VideoType,
};

export class GetFeedInput extends GqlGetFeedInput {
  @IsEnum(FeedType)
  feedType?: FeedType;
  @IsEnum(PostKind)
  postType?: PostKind;
  @Length(16)
  authorId?: string;
  @Length(16)
  userId?: string;
}

export class GetFeedResult {
  __typename?: 'GetFeedResult';
  feed?: Feed;
}

export class GetPostInput extends GqlGetPostInput {
  @IsNotEmpty()
  id: string;
}

export class GetCommentInput extends GqlGetCommentInput {
  @IsNotEmpty()
  id: string;
}

export class FollowUserInput extends GqlFollowUserInput {
  @IsNotEmpty()
  userId: string;
}

export class FollowUserResult extends GqlFollowUserResult {}

export type FollowUserOutput = FollowUserResult | SmartError;

export class UnfollowUserInput extends GqlUnfollowUserInput {
  @IsNotEmpty()
  userId: string;
}

export class UnfollowUserResult extends GqlUnfollowUserResult {}

export type UnfollowUserOutput = UnfollowUserResult | SmartError;

export class TagInput extends GqlTagInput {
  @ValidateIf((o: TagInput) => !o.name)
  @IsNotEmpty()
  id?: string;
  @ValidateIf((o: TagInput) => !o.id)
  @IsNotEmpty()
  name?: string;
  noSpace?: boolean;
}

export class SegmentPositionInput extends GqlSegmentPositionInput {
  @IsNotEmpty()
  position: number;
  @IsNotEmpty()
  segmentType: SegmentType;
}

export class TextInput extends GqlTextInput {
  @IsNotEmpty()
  chunk: string;
  // @IsNotEmpty()
  langCode: string;
}

export class TextSegmentInput extends GqlTextSegmentInput {
  @IsNotEmpty()
  position: number;
  @IsNotEmpty()
  text: TextInput;
}

export class TagSegmentInput extends GqlTagSegmentInput {
  @IsNotEmpty()
  position: number;
  @IsNotEmpty()
  tag: TagInput;
}

export class UserSegmentInput extends GqlUserSegmentInput {
  @IsNotEmpty()
  position: number;
  @IsNotEmpty()
  userId: string;
}

export class ContentInput extends GqlContentInput {
  @ArrayNotEmpty()
  segments?: SegmentPositionInput[];
  textSegments?: TextSegmentInput[];
  tagSegments?: TagSegmentInput[];
  userSegments?: UserSegmentInput[];
}

export class TextPostPropertiesInput extends GqlTextPostPropertiesInput {
  content: ContentInput;
}

export class ImagePostPropertiesInput extends GqlImagePostPropertiesInput {
  image: Upload;
  thumbnail: Upload;
}

export class VideoPostPropertiesInput extends GqlVideoPostPropertiesInput {
  video: Upload;
  thumbnail: Upload;
}

export class PostPropertiesInput {
  textInput?: TextPostPropertiesInput;
  imageInput?: ImagePostPropertiesInput;
  videoInput?: VideoPostPropertiesInput;
}

export class RepostInput extends GqlRepostInput {
  @IsNotEmpty()
  postId: string;
  expirationHourCount?: number;
  caption?: ContentInput;
  properties: PostPropertiesInput[];
  shouldBypassTrollDetection: boolean;
  accessControl?: PostAccessControl;
}

export class CreateMultiMediaPostInput extends GqlMultiMediaPostInput {
  expirationHourCount?: number;
  commenterScope?: CommenterScope;
  visibility?: PostVisibility;
  caption?: ContentInput;
  tags?: TagInput[];
  mentions?: string[];
  thumbnail?: Upload;
  properties: PostPropertiesInput[];
  shouldBypassTrollDetection: boolean;
  negativeConfidenceCount?: number;
  accessControl?: PostAccessControl;
  challengeId: string;
}

export class CreateTextPostInput extends GqlCreateTextPostInput {
  expirationHourCount?: number;
  commenterScope?: CommenterScope;
  visibility?: PostVisibility;
  @IsNotEmptyObject()
  content?: ContentInput;
  tags?: TagInput[];
  userMentions?: string[];
}

export class CreateImagePostInput extends GqlCreateImagePostInput {
  expirationHourCount?: number;
  commenterScope?: CommenterScope;
  visibility?: PostVisibility;
  @IsNotEmpty()
  image: Upload;
  content?: ContentInput;
}

export class UploadImageInput extends GqlUploadImageInput {
  @IsNotEmpty()
  image: Upload;
}

export class UploadVideoInput extends GqlUploadVideoInput {
  @IsNotEmpty()
  video: Upload;
}

export class CreateVideoPostInput extends GqlCreateVideoPostInput {
  expirationHourCount?: number;
  commenterScope?: CommenterScope;
  visibility?: PostVisibility;
  @IsNotEmpty()
  video: Upload;
  content?: ContentInput;
}

export class UpdateCommentParticipationInput extends GqlUpdateCommentParticipationInput {
  @IsNotEmpty()
  commentId: string;
  @IsEnum(ParticipationType)
  type: ParticipationType;
}

export class UpdateCommentParticipationResult extends GqlUpdateCommentParticipationResult {
  comment?: Comment;
}

export class UpdateCommentParticipationError extends GqlUpdateCommentParticipationError {}

export enum ReportType {
  UNKNOWN = 0,
  ONE = 1,
  TWO,
  THREE,
  FOUR,
  FIVE,
  UNREPORT,
}

export class ReportCommentInput extends GqlReportCommentInput {
  @IsNotEmpty()
  commentId: string;
  @IsEnum(ReportType)
  type: ReportType;
}

export class ReportCommentResult extends GqlReportCommentResult {
  comment?: Comment;
}

export type ReportCommentOutput = ReportCommentResult | SmartError;

export class ReactOnCommentInput extends GqlReactOnCommentInput {
  @IsNotEmpty()
  commentId: string;
  @IsEnum(ReactionType)
  reaction: ReactionType;
}

export class DeleteCommentInput extends GqlDeleteCommentInput {
  @IsNotEmpty()
  commentId: string;
}

export class DeleteCommentResult extends GqlDeleteCommentResult {
  isSuccessful: boolean;
}

export type DeleteCommentOutput = DeleteCommentResult | SmartError;

export class FirebaseAuthEmailInput extends GqlFirebaseAuthEmailInput {
  @IsNotEmpty()
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoUrl?: string;
  @IsNotEmpty()
  uid: string;
  fcmToken?: string;
}

export class FirebaseAuthPhoneNumberInput extends GqlFirebaseAuthPhoneNumberInput {
  @IsNotEmpty()
  phoneNumber: string;
  @IsNotEmpty()
  uid: string;
  gender: string;
  fcmToken: string;
}

export type FirebaseAuthOutput =
  | LoginOutput
  | SmartError
  | AskForHandleAndNameError;

export class FirebaseSignupInput extends GqlFirebaseSignupInput {
  email?: string;
  phoneNumber?: string;
  name?: string;
  handle: string;
  @IsNotEmpty()
  uid: string;
  gender: Gender;
  language: string;
  image?: Upload;
  inviteCode?: number;
  fcmToken?: string;
  birthday?: Date;
  categoryIds?: string[];
}

export type FirebaseSignupOutput =
  | SignUpOutput
  | SmartError
  | AskForHandleAndNameError
  | HandleAlreadyTakenError;

//export type DeleteFirebaseUserOutput =

export class ReportReplyInput extends GqlReportReplyInput {
  @IsNotEmpty()
  replyId: string;
  @IsEnum(ReportType)
  type: ReportType;
}

export class ReportReplyResult extends GqlReportReplyResult {
  reply?: Reply;
}

export type ReportReplyOutput = ReportReplyResult | SmartError;

export class DeleteReplyInput extends GqlDeleteReplyInput {
  @IsNotEmpty()
  replyId: string;
}

export class DeleteReplyResult extends GqlDeleteReplyResult {
  isSuccessful: boolean;
}

export type DeleteReplyOutput = DeleteReplyResult | SmartError;

export class ReportPostInput extends GqlReportPostInput {
  @IsNotEmpty()
  postId: string;
  @IsEnum(ReportType)
  type: ReportType;
}

export class ReportPostResult extends GqlReportPostResult {
  post?: Post;
}

export type ReportPostOutput = ReportPostResult | SmartError;

export class GetFollowersListInput extends GqlGetFollowersListInput {
  @IsNotEmpty()
  userId: string;
}

export class GetFollowersListResult extends GqlGetFollowersListResult {
  user: User;
}

export type GetFollowersListOutput = GetFollowersListResult | SmartError;

export class PinCommentInput extends GqlPinCommentInput {
  commentId: string;
}

export class PinCommentResult extends GqlPinCommentResult {
  post: Post;
  challenge: Challenge;
}

export type PinCommentOutput = PinCommentResult | SmartError;

export class SharePostInput extends GqlSharePostInput {
  @IsNotEmpty()
  postId: string;
}

export class AddCommentInput extends GqlAddCommentInput {
  postId?: string;
  challengeId?: string;
  @IsNotEmpty()
  content: ContentInput;
  participationType: ParticipationType;
  shouldBypassTrollDetection?: boolean;
  negativeConfidenceCount?: number;
}

export class MediaSourceInput extends GqlMediaSourceInput {
  @IsUrl()
  uri?: URL;
}

export class UserInput extends GqlUserInput {
  @IsString()
  @Length(16)
  id?: string;
  @IsString()
  handle?: string;
  @IsString()
  name?: string;
  @IsEmail()
  email?: string;
  password?: string;
  // @IsPhoneNumber()
  phoneNumber?: string;
  avatarImage?: MediaSourceInput;
  gender?: Gender;
}

export class SignUpWithPhoneNumberInput extends GqlSignUpWithPhoneNumberInput {
  @IsNotEmpty()
  phoneNumber: string;
  inviteCode?: number;

  @IsNotEmpty()
  fcmToken: string;
}

export class SignUpWithEmailInput extends GqlSignUpWithEmailInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MaxLength(100)
  @MinLength(12)
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  handle: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  gender: Gender;

  @IsNotEmpty()
  langCode: string;

  inviteCode?: number;

  @IsNotEmpty()
  fcmToken: string;
}

export class AddReplyInput extends GqlAddReplyInput {
  @IsNotEmpty()
  commentId: string;
  @IsNotEmpty()
  content: ContentInput;
  shouldBypassTrollDetection: boolean;
  negativeConfidenceCount: number;
}

export interface Node {
  id: string;
}

export interface FeedEntry {
  id: string;
  ts?: Timestamps;
}

export interface Post extends GqlPost {
  id: string;
  author?: User;
  ts?: Timestamps;
  commentsConnection?: PostCommentsConnection;
  currentUserContext?: PostContext;
  stats?: PostStats;
  tags?: Tag[];
  willBeDeleted?: boolean;
  sensitiveStatus?: SensitiveStatus;
  isPrivate: boolean;
  baseType: PostBaseType;
}

export class MediaSource {
  __typename?: 'MediaSource';
  uri?: URL | Promise<URL>;
}

export class Image {
  __typename?: 'Image';
  id: string;
  source?: MediaSource;
  type?: ImageType;
}

export class Video {
  __typename?: 'Video';
  id: string;
  source?: MediaSource;
  type?: VideoType;
}

export class Timestamps {
  __typename?: 'Timestamps';
  createdAt?: DateTime;
  updatedAt?: DateTime;
  expiry?: DateTime;
}

export class Tag {
  __typename?: 'Tag';
  id: string;
  name?: string;
  noSpace?: boolean;
}

export class UserRef {
  __typename?: 'UserRef';
  id: string;
  handle?: string;
}

export class UserMention {
  __typename?: 'UserMention';
  id: string;
  User?: UserRef;
}

export class UserStats extends GqlUserStats {
  __typename?: 'UserStats';
  followingCount?: number;
  followerCount?: number;
  postCount?: number;
  innerCircleCount?: number;
  joinedChallengesCount?: number;
  createdChallengesCount?: number;
}

export class UserStrikeData {
  __typename?: 'UserStrikeData';

  score: number;

  isFaded: boolean;
  currentStrikeCount?: number;

  firstStrikeCount?: number;
  firstStrikeTS?: Date;
  firstStrikeExpiryTS?: Date;

  secondStrikeCount?: number;
  secondStrikeTS?: Date;
  secondStrikeExpiryTS?: Date;

  thirdStrikeCount?: number;
  thirdStrikeTS?: Date;
  thirdStrikeExpiryTS?: Date;

  permanentSuspensionCount?: number;
  finalStrikeTimeStamps?: Date[];
}

export class FollowerEdge {
  __typename?: 'FollowerEdge';
  isFollowing?: boolean;
}

export class UserPostsEdge extends GqlUserPostsEdge {
  node: Post;
}

export class UserPostsConnection extends GqlUserPostsConnection {
  pageInfo: PageInfo;
  edges?: UserPostsEdge[];
}

export class UserFollowersEdge extends GqlUserFollowersEdge {
  node: User;
}

export class UserFollowersList extends GqlUserFollowersList {
  pageInfo: PageInfo;
  edges?: UserFollowersEdge[];
}

export class UserFollowingsEdge extends GqlUserFollowingsEdge {
  node: User;
}

export class UserFollowingsList extends GqlUserFollowingsList {
  pageInfo: PageInfo;
  edges?: UserFollowingsEdge[];
}

export class BlockedUsersEdge extends GqlBlockedUsersEdge {
  node: User;
}

export class BlockedUsersList extends GqlBlockedUsersList {
  pageInfo: PageInfo;
  edges?: BlockedUsersEdge[];
}

export class User extends GqlUser {
  id: string;
  ts?: Timestamps;
  handle?: string;
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  avatarImage?: MediaSource;
  gender?: Gender;
  stats?: UserStats;
  strikeData?: UserStrikeData;
  followerConnection?: FollowerEdge;
  postsConnection?: UserPostsConnection;
  commentEnabledAt?: DateTime;
  commentOnboardedAt?: DateTime;
  userCreatedAt?: DateTime;
  score: number;
  embargoExpirationDaysDelta?: number;
  remainingInvitesCount?: number;
  hasPersonalizedFeed?: boolean;
}

export class PostStats extends GqlPostStats {}

export class CommentStats extends GqlCommentStats {
  __typename?: 'CommentStats';
}

export class ReplyStats {
  __typename?: 'ReplyStats';
  likeCount?: number;
}

export class PostCommentContext {
  __typename?: 'PostCommentContext';
  liked?: boolean;
}

export class CommentContext {
  __typename?: 'CommentContext';
  liked?: boolean;
}

export class CommentReplyContext {
  __typename?: 'CommentReplyContext';
  liked?: boolean;
}

export class UserContext extends GqlUserContext {}

export class PostContext extends GqlPostContext {}

export class FeedPostsEdge {
  __typename?: 'FeedPostsEdge';
  cursor: string;
  node: Post;
}

export class FeedPostsConnection {
  __typename?: 'FeedPostsConnection';
  pageInfo: PageInfo;
  edges?: FeedPostsEdge[];
}

export class Feed {
  __typename?: 'Feed';
  id: string;
  ts?: Timestamps;
  postsConnection?: FeedPostsConnection;
  entries?: Post[];
  messageCount?: number;
}

export class Reply implements Node {
  __typename?: 'Reply';
  id: string;
  ts?: Timestamps;
  author?: User;
  body?: Content;
  replyStats?: ReplyStats;
  commentReplyContext?: CommentReplyContext;
}

export class Comment implements Node {
  __typename?: 'Comment';
  id: string;
  ts?: Timestamps;
  author?: User;
  body?: Content;
  commentStats?: CommentStats;
  postCommentContext?: PostCommentContext;
  repliesConnection?: CommentRepliesConnection;
  participationType: ParticipationType;
}

export class CommentRepliesEdge {
  __typename?: 'CommentRepliesEdge';
  cursor: string;
  node: Reply;
}

export class PostCommentsEdge {
  __typename?: 'PostCommentsEdge';
  cursor: string;
  node: Comment;
}

export class PostCommentsConnection extends GqlPostCommentsConnection {
  __typename?: 'PostCommentsConnection';
  pageInfo: PageInfo;
  edges?: PostCommentsEdge[];
  targetError?: string;
}

export type ContentSegment = Text | Tag | User;

export class Content extends GqlContent {
  // body?: string
  wordCount?: number;
  // lang?: Language
  segments?: ContentSegment[];
}

export class MultiMediaPost implements Node, Post, FeedEntry {
  __typename?: 'MultiMediaPost';
  id: string;
  ts?: Timestamps;
  author?: User;
  commentsConnection?: PostCommentsConnection;
  currentUserContext?: PostContext;
  stats?: PostStats;
  tags?: Tag[];
  caption?: Content;
  thumbnail?: Image;
  properties?: PostProperties[];
  willBeDeleted?: boolean;
  sensitiveStatus?: SensitiveStatus;
  isPrivate: boolean;
  baseType: PostBaseType;
  repostMeta?: RepostMeta;
  parentChallenge?: Challenge;
}

export class TextPost implements Node, Post, FeedEntry {
  isPrivate: boolean;
  __typename?: 'TextPost';
  willBeDeleted?: boolean;
  sensitiveStatus?: SensitiveStatus;
  id: string;
  ts?: Timestamps;
  author?: User;
  commentsConnection?: PostCommentsConnection;
  currentUserContext?: PostContext;
  stats?: PostStats;
  tags?: Tag[];
  content?: Content;
  baseType: PostBaseType;
}

export class ImagePost implements Node, Post, FeedEntry {
  isPrivate: boolean;
  __typename?: 'ImagePost';
  willBeDeleted?: boolean;
  sensitiveStatus?: SensitiveStatus;
  id: string;
  ts?: Timestamps;
  author?: User;
  commentsConnection?: PostCommentsConnection;
  currentUserContext?: PostContext;
  stats?: PostStats;
  tags?: Tag[];
  image?: Image;
  thumbnail?: Image;
  caption?: Content;
  baseType: PostBaseType;
}

export class VideoPost implements Node, Post, FeedEntry {
  isPrivate: boolean;
  __typename?: 'VideoPost';
  willBeDeleted?: boolean;
  sensitiveStatus?: SensitiveStatus;
  id: string;
  ts?: Timestamps;
  author?: User;
  commentsConnection?: PostCommentsConnection;
  currentUserContext?: PostContext;
  stats?: PostStats;
  tags?: Tag[];
  video?: Video;
  thumbnail?: Image;
  caption?: Content;
  baseType: PostBaseType;
  parentChallenge?: Challenge;
}

export class Notification {
  __typename?: 'Notification';
  id: string;
  body?: Content;
}

export class UploadImageOutput {
  __typename?: 'UploadImageOutput';
  id: string;
}

export class UploadVideoOutput {
  __typename?: 'UploadVideoOutput';
  id: string;
}

export class SharePostOutput {
  __typename?: 'SharePostOutput';
  post?: Post;
}

export type AddCommentOutput =
  | AddCommentResult
  | SmartError
  | TrollDetectorError
  | PostNotFoundError;

export class AddReplyResult extends GqlAddReplyResult {
  reply?: Reply;
  comment?: Comment;
}

export type AddReplyOutput = AddReplyResult | SmartError | TrollDetectorError;

export class LoginOutput extends GqlLoginOutput {}

export class SignUpOutput extends GqlSignUpOutput {}

export interface Error {
  message: string;
}

export class CreatePostResult {
  __typename?: 'CreatePostResult';
  post: Post;
}

export class CreatePostInvalidInputError implements Error {
  __typename?: 'CreatePostInvalidInputError';
  message: string;
  contentErrorMessage?: string;
}

export class SearchInput extends GqlSearchInput {
  @IsNotEmpty()
  query: string;
  @IsNotEmpty()
  objectType: ObjectType;
  @IsNotEmpty()
  mode: SearchMode;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export type SearchNode = User | Tag;

export class SearchEdge {
  __typename?: 'SearchEdge';
  cursor: string;
  node: SearchNode;
}

export class SearchResult {
  __typename?: 'SearchResult';
  pageInfo: PageInfo;
  objectType?: ObjectType;
  result?: SearchEdge[];
}

export class ESInput extends GqlESInput {
  query: string;
  from?: number;
  size?: number;
  @IsNotEmpty() type: ESearchType;
}

export type ESOutput = ESResult | SmartError;

export class GetUserInput extends GqlGetUserInput {
  @IsNotEmpty()
  id: string;
}

export class GetUserResult {
  __typename?: 'GetUserResult';
  user?: User | Promise<User>;
}

export class GetPostResult {
  __typename?: 'GetPostResult';
  post?: Post;
}

export class GetPostCommentsResult {
  __typename?: 'GetPostCommentsResult';
  post?: Post;
}

export class GetPostCommentsError implements Error {
  __typename?: 'GetPostCommentsError';
  message: string;
}

export class RepostResult {
  __typename?: 'RepostResult';
  post?: Post;
}

export class RepostError implements Error {
  __typename?: 'RepostError';
  message: string;
}

@ArgsType()
export class DeleteFirebaseUserArgs {
  @IsNotEmpty()
  uid: string;
}

export abstract class IMutation {
  __typename?: 'IMutation';

  abstract followUser(
    input?: FollowUserInput
  ): FollowUserOutput | Promise<FollowUserOutput>;

  abstract unfollowUser(
    input?: UnfollowUserInput
  ): UnfollowUserOutput | Promise<UnfollowUserOutput>;

  abstract uploadImage(
    input: UploadImageInput
  ): UploadImageOutput | Promise<UploadImageOutput>;

  abstract uploadVideo(
    input: UploadVideoInput
  ): UploadVideoOutput | Promise<UploadVideoOutput>;

  abstract sharePost(
    input: SharePostInput
  ): SharePostOutput | Promise<SharePostOutput>;

  abstract addComment(
    input: AddCommentInput
  ): AddCommentOutput | Promise<AddCommentOutput>;

  abstract addReply(
    input: AddReplyInput
  ): AddReplyOutput | Promise<AddReplyOutput>;

  abstract login(
    username: string,
    password: string
  ): LoginOutput | Promise<LoginOutput>;

  abstract signUpWithEmail(
    input: SignUpWithEmailInput
  ): SignUpOutput | Promise<SignUpOutput>;

  abstract signUpWithPhoneNumber(
    input: SignUpWithPhoneNumberInput
  ): SignUpOutput | Promise<SignUpOutput>;

  abstract getOrDeleteFirebaseUser(uid: string): GetOrDeleteFirebaseUserOutput;
}

export type Upload = any;
export type URL = any;
export type Time = any;
export type DateTime = any;
export type Timestamp = any;
export type GetPostOutput = GetPostResult | SmartError;
export type GetPostCommentsOutput =
  | GetPostCommentsResult
  | GetPostCommentsError;
export type CreatePostOutput =
  | CreatePostResult
  | SmartError
  | TrollDetectorError
  | CreatePostInvalidInputError;

export interface RealIdFaceData {
  faceSignature: number[];
}

export interface RealIdFailedVerificationImageData {
  isSmiling: boolean;
  image: Upload;
  handGesture: RealIdHandGesture;
}

export interface UpdateRealIdVerificationInput {
  faceData: RealIdFaceData;
  faceImage: Upload;
  passFailState: PassFailState;
  realIdFailedVerificationImageData?: RealIdFailedVerificationImageData[];
}

export class ChallengeCoverImageInput extends GqlChallengeCoverImageInput {
  image: Upload;
  thumbnail?: Upload;
}

export class CreateChallengeInput extends GqlCreateChallengeInput {
  name: string;
  description: ContentInput;
  coverImage: ChallengeCoverImageInput;
  coverEnum: ChallengeCoverEnum;
  categoryIds?: string[];
  challengeLengthInDays?: number;
}

export class EditChallengeInput extends GqlEditChallengeInput {
  id: string;
  name?: string;
  description?: ContentInput;
  coverImage?: ChallengeCoverImageInput;
  coverEnum?: ChallengeCoverEnum;
  categoryIds?: string[];
  challengeLengthInDays?: number;
}

export interface WildrVerifiedManualReviewInput
  extends GqlWildrVerifiedManualReviewInput {
  faceImage: Upload;
  manualReviewImage: Upload;
}

export class SendContactUsEmailInput extends GqlSendContactUsEmailInput {
  @IsOptional()
  @MaxLength(100)
  name: string;
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  from: string;
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;
  @IsNotEmpty()
  @MaxLength(1000)
  body: string;
}
