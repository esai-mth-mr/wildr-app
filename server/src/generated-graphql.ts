
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum Gender {
    FEMALE = "FEMALE",
    MALE = "MALE",
    OTHER = "OTHER",
    NOT_SPECIFIED = "NOT_SPECIFIED"
}

export enum ImageType {
    PNG = "PNG",
    JPEG = "JPEG",
    WEBP = "WEBP"
}

export enum ParticipationType {
    FINAL = "FINAL",
    OPEN = "OPEN"
}

export enum ReportType {
    UNKNOWN = "UNKNOWN",
    ONE = "ONE",
    TWO = "TWO",
    THREE = "THREE",
    FOUR = "FOUR",
    FIVE = "FIVE",
    UNREPORT = "UNREPORT"
}

export enum VideoType {
    MP4 = "MP4",
    MOV = "MOV"
}

export enum ReactionType {
    NONE = "NONE",
    LIKE = "LIKE",
    REAL = "REAL",
    APPLAUD = "APPLAUD",
    UN_LIKE = "UN_LIKE",
    UN_REAL = "UN_REAL",
    UN_APPLAUD = "UN_APPLAUD"
}

export enum InviteState {
    JOINED_PENDING_VERIFICATION = "JOINED_PENDING_VERIFICATION",
    JOINED_VERIFIED = "JOINED_VERIFIED"
}

export enum OnboardingType {
    INNER_CIRCLE = "INNER_CIRCLE",
    COMMENT_REPLY_LIKES = "COMMENT_REPLY_LIKES",
    CHALLENGES = "CHALLENGES",
    CHALLENGE_AUTHOR_INTERACTIONS = "CHALLENGE_AUTHOR_INTERACTIONS",
    CHALLENGE_EDUCATION = "CHALLENGE_EDUCATION"
}

export enum PaginationOrder {
    DEFAULT = "DEFAULT",
    LATEST_FIRST = "LATEST_FIRST",
    OLDEST_FIRST = "OLDEST_FIRST"
}

export enum PostKind {
    TEXT = "TEXT",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    IMAGE = "IMAGE",
    MULTI_MEDIA = "MULTI_MEDIA"
}

export enum PostBaseType {
    POST = "POST",
    STORY = "STORY",
    REPOST = "REPOST",
    REPOST_STORY = "REPOST_STORY"
}

export enum CommenterScope {
    ALL = "ALL",
    FOLLOWING = "FOLLOWING",
    NONE = "NONE"
}

export enum PostVisibilityAccess {
    EVERYONE = "EVERYONE",
    FOLLOWERS = "FOLLOWERS",
    INNER_CIRCLE = "INNER_CIRCLE",
    LIST = "LIST"
}

export enum CommentPostingAccess {
    NONE = "NONE",
    EVERYONE = "EVERYONE",
    FOLLOWERS = "FOLLOWERS",
    INNER_CIRCLE = "INNER_CIRCLE",
    LIST = "LIST"
}

export enum RepostAccess {
    NONE = "NONE",
    EVERYONE = "EVERYONE",
    FOLLOWERS = "FOLLOWERS",
    INNER_CIRCLE = "INNER_CIRCLE",
    LIST = "LIST"
}

export enum CommentVisibilityAccess {
    NONE = "NONE",
    AUTHOR = "AUTHOR",
    EVERYONE = "EVERYONE",
    FOLLOWERS = "FOLLOWERS",
    INNER_CIRCLE = "INNER_CIRCLE",
    LIST = "LIST"
}

export enum PostVisibility {
    ALL = "ALL",
    FOLLOWERS = "FOLLOWERS"
}

export enum FeedScopeType {
    PUBLIC = "PUBLIC",
    FOLLOWING = "FOLLOWING",
    GLOBAL = "GLOBAL",
    PERSONALIZED = "PERSONALIZED",
    PERSONALIZED_FOLLOWING = "PERSONALIZED_FOLLOWING",
    LIST_CONSUMPTION = "LIST_CONSUMPTION",
    INNER_CIRCLE_CONSUMPTION = "INNER_CIRCLE_CONSUMPTION",
    LIST_DISTRIBUTION = "LIST_DISTRIBUTION",
    INNER_CIRCLE_DISTRIBUTION = "INNER_CIRCLE_DISTRIBUTION"
}

export enum FeedType {
    ALL = "ALL",
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    MULTI_MEDIA = "MULTI_MEDIA"
}

export enum ObjectType {
    UNKNOWN = "UNKNOWN",
    USER = "USER",
    TAG = "TAG"
}

export enum SearchMode {
    PREFIX = "PREFIX",
    FULL_TEXT = "FULL_TEXT"
}

export enum ESearchType {
    ALL = "ALL",
    USER = "USER",
    HASHTAGS = "HASHTAGS",
    POST = "POST",
    TOP = "TOP"
}

export enum ESItemType {
    USER = "USER",
    POST = "POST",
    TAG = "TAG"
}

export enum ActivityVerb {
    REACTION_LIKE = "REACTION_LIKE",
    REACTION_REAL = "REACTION_REAL",
    REACTION_APPLAUD = "REACTION_APPLAUD",
    COMMENTED = "COMMENTED",
    REPLIED = "REPLIED",
    REPOSTED = "REPOSTED",
    FOLLOWED = "FOLLOWED",
    COMMENT_EMBARGO_LIFTED = "COMMENT_EMBARGO_LIFTED",
    REC_FIRST_STRIKE = "REC_FIRST_STRIKE",
    REC_SECOND_STRIKE = "REC_SECOND_STRIKE",
    REC_FINAL_STRIKE = "REC_FINAL_STRIKE",
    POSTED = "POSTED",
    IMPROVED_PROFILE_RING = "IMPROVED_PROFILE_RING",
    MENTIONED_IN_POST = "MENTIONED_IN_POST",
    MENTIONED_IN_COMMENT = "MENTIONED_IN_COMMENT",
    MENTIONED_IN_REPLY = "MENTIONED_IN_REPLY",
    ADDED_TO_IC = "ADDED_TO_IC",
    AUTO_ADDED_TO_IC = "AUTO_ADDED_TO_IC",
    AUTO_ADDED_TO_FOLLOWING = "AUTO_ADDED_TO_FOLLOWING",
    JOINED_CHALLENGE = "JOINED_CHALLENGE",
    CHALLENGE_CREATED = "CHALLENGE_CREATED"
}

export enum ActivityType {
    UNKNOWN = "UNKNOWN",
    SINGLE = "SINGLE",
    AGGREGATED = "AGGREGATED",
    META_EVENT = "META_EVENT",
    SYSTEM = "SYSTEM"
}

export enum ActivityObjectType {
    NONE = "NONE",
    USER = "USER",
    POST_TEXT = "POST_TEXT",
    POST_IMAGE = "POST_IMAGE",
    POST_VIDEO = "POST_VIDEO",
    POST_MULTI_MEDIA = "POST_MULTI_MEDIA",
    COMMENT = "COMMENT",
    REPLY = "REPLY",
    CHALLENGE = "CHALLENGE"
}

export enum InviteCodeAction {
    ADD_TO_INNER_LIST = "ADD_TO_INNER_LIST",
    ADD_TO_FOLLOWING_LIST = "ADD_TO_FOLLOWING_LIST",
    SHARE_CHALLENGE = "SHARE_CHALLENGE"
}

export enum OSName {
    ANDROID = "ANDROID",
    IOS = "IOS"
}

export enum ChallengeCoverEnum {
    TYPE_1 = "TYPE_1",
    TYPE_2 = "TYPE_2",
    TYPE_3 = "TYPE_3",
    TYPE_4 = "TYPE_4",
    TYPE_5 = "TYPE_5",
    TYPE_6 = "TYPE_6",
    TYPE_7 = "TYPE_7",
    TYPE_8 = "TYPE_8"
}

export enum ChallengeAuthorInteractionListType {
    TODAY = "TODAY"
}

export enum ChallengeListType {
    MY_CHALLENGES = "MY_CHALLENGES",
    OWNED_CHALLENGES = "OWNED_CHALLENGES",
    FEATURED = "FEATURED",
    ALL_ACTIVE = "ALL_ACTIVE",
    ALL_PAST = "ALL_PAST",
    ALL = "ALL"
}

export enum ChallengeState {
    CREATED = "CREATED",
    ACTIVE = "ACTIVE",
    ENDED = "ENDED"
}

export enum TransactionFilter {
    AWARD = "AWARD"
}

export enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}

export enum TransactionFailureReason {
    INTERNAL_ERROR = "INTERNAL_ERROR"
}

export enum SegmentType {
    TEXT = "TEXT",
    TAG = "TAG",
    USER = "USER"
}

export enum FlagOperationType {
    FLAG = "FLAG",
    UN_FLAG = "UN_FLAG"
}

export enum BlockOperationType {
    BLOCK = "BLOCK",
    UN_BLOCK = "UN_BLOCK"
}

export enum LinkSourceType {
    POST = "POST",
    CHALLENGE = "CHALLENGE",
    USER = "USER"
}

export enum RealIdHandGesture {
    PEACE = "PEACE",
    THUMBS_UP = "THUMBS_UP",
    THUMBS_DOWN = "THUMBS_DOWN",
    CROSSED_FINGERS = "CROSSED_FINGERS",
    FIST = "FIST",
    HORN_FINGERS = "HORN_FINGERS",
    RAISED_HAND = "RAISED_HAND",
    HANG_LOOSE = "HANG_LOOSE",
    POINT_FINGER = "POINT_FINGER"
}

export enum PassFailState {
    PASS = "PASS",
    FAIL = "FAIL"
}

export enum RealIdVerificationStatus {
    UNVERIFIED = "UNVERIFIED",
    PENDING_REVIEW = "PENDING_REVIEW",
    REVIEW_REJECTED = "REVIEW_REJECTED",
    VERIFIED = "VERIFIED"
}

export enum SensitiveStatus {
    NSFW = "NSFW"
}

export enum UserListVisibility {
    NONE = "NONE",
    AUTHOR = "AUTHOR",
    EVERYONE = "EVERYONE",
    FOLLOWERS = "FOLLOWERS",
    INNER_CIRCLE = "INNER_CIRCLE"
}

export enum ViolatedGuideline {
    NONE = "NONE",
    INTRODUCTION = "INTRODUCTION",
    VIOLENT_EXTREMISM = "VIOLENT_EXTREMISM",
    THREATS_AND_INCITEMENT_TO_VIOLENCE = "THREATS_AND_INCITEMENT_TO_VIOLENCE",
    DANGEROUS_INDIVIDUALS_AND_ORGANIZATIONS = "DANGEROUS_INDIVIDUALS_AND_ORGANIZATIONS",
    HATEFUL_BEHAVIOR = "HATEFUL_BEHAVIOR",
    ILLEGAL_ACTIVITIES_AND_REGULATED_GOODS = "ILLEGAL_ACTIVITIES_AND_REGULATED_GOODS",
    CRIMINAL_ACTIVITIES = "CRIMINAL_ACTIVITIES",
    WEAPONS = "WEAPONS",
    DRUGS_CONTROLLED_SUBSTANCES_ALCOHOL_AND_TOBACCO = "DRUGS_CONTROLLED_SUBSTANCES_ALCOHOL_AND_TOBACCO",
    FRAUDS_AND_SCAMS = "FRAUDS_AND_SCAMS",
    GAMBLING = "GAMBLING",
    PRIVACY_PERSONAL_DATA_AND_PERSONALLY_IDENTIFIABLE_INFORMATION_PII = "PRIVACY_PERSONAL_DATA_AND_PERSONALLY_IDENTIFIABLE_INFORMATION_PII",
    VIOLENT_AND_GRAPHIC_CONTENT = "VIOLENT_AND_GRAPHIC_CONTENT",
    SUICIDE_SELF_HARM_AND_DANGEROUS_ACTS = "SUICIDE_SELF_HARM_AND_DANGEROUS_ACTS",
    SUICIDE = "SUICIDE",
    SELF_HARM_AND_EATING_DISORDERS = "SELF_HARM_AND_EATING_DISORDERS",
    DANGEROUS_ACTS = "DANGEROUS_ACTS",
    TROLLING_HARASSMENT_AND_BULLYING = "TROLLING_HARASSMENT_AND_BULLYING",
    TROLLING_AND_ABUSIVE_BEHAVIOR = "TROLLING_AND_ABUSIVE_BEHAVIOR",
    SEXUAL_HARASSMENT = "SEXUAL_HARASSMENT",
    THREATS_OF_HACKING_DOXXING_AND_BLACKMAIL = "THREATS_OF_HACKING_DOXXING_AND_BLACKMAIL",
    ADULT_NUDITY_AND_SEXUAL_ACTIVITIES = "ADULT_NUDITY_AND_SEXUAL_ACTIVITIES",
    SEXUAL_EXPLOITATION = "SEXUAL_EXPLOITATION",
    NUDITY_AND_SEXUAL_ACTIVITY_INVOLVING_ADULTS = "NUDITY_AND_SEXUAL_ACTIVITY_INVOLVING_ADULTS",
    MINOR_SAFETY = "MINOR_SAFETY",
    INTEGRITY_AND_AUTHENTICITY = "INTEGRITY_AND_AUTHENTICITY",
    PLATFORM_SECURITY = "PLATFORM_SECURITY"
}

export enum ChallengeEntryPinFlag {
    PIN = "PIN",
    UNPIN = "UNPIN"
}

export enum WaitlistType {
    WILDRCOIN = "WILDRCOIN"
}

export class GetStrikeReportInput {
    id: string;
}

export class UpdateCategoryInterestsInput {
    categoryIds: string[];
}

export class UpdatePostTypeInterestsInput {
    postTypes: string[];
}

export class InvitesConnectionInput {
    paginationInput: PaginationInput;
}

export class PaginationInput {
    take?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
    pageNumber?: Nullable<number>;
    includingAndAfter?: Nullable<string>;
    includingAndBefore?: Nullable<string>;
    order?: Nullable<PaginationOrder>;
}

export class PostVisibilityAccessData {
    access: PostVisibilityAccess;
    listIds?: Nullable<string[]>;
}

export class CommentVisibilityAccessData {
    access: CommentVisibilityAccess;
    listIds?: Nullable<string[]>;
}

export class CommentPostingAccessData {
    access: CommentPostingAccess;
    listIds?: Nullable<string[]>;
}

export class RepostAccessData {
    access: RepostAccess;
    listIds?: Nullable<string[]>;
}

export class PostAccessControl {
    postVisibilityAccessData: PostVisibilityAccessData;
    commentVisibilityAccessData: CommentVisibilityAccessData;
    commentPostingAccessData: CommentPostingAccessData;
    repostAccessData?: Nullable<RepostAccessData>;
}

export class GetFeedInput {
    feedType?: Nullable<FeedType>;
    postType?: Nullable<PostKind>;
    scopeType?: Nullable<FeedScopeType>;
    authorId?: Nullable<string>;
    userId?: Nullable<string>;
    listId?: Nullable<string>;
}

export class GetPostInput {
    id: string;
}

export class GetCommentInput {
    id: string;
}

export class GetUserInput {
    id: string;
}

export class GetReplyInput {
    id: string;
}

export class GetFollowersListInput {
    userId: string;
}

export class GetFollowingsListInput {
    userId: string;
}

export class GetBlockListInput {
    userId: string;
}

export class SearchInput {
    query?: Nullable<string>;
    objectType?: Nullable<ObjectType>;
    mode?: Nullable<SearchMode>;
    first?: Nullable<number>;
    after?: Nullable<string>;
    last?: Nullable<number>;
    before?: Nullable<string>;
}

export class ESInput {
    query?: Nullable<string>;
    from?: Nullable<number>;
    size?: Nullable<number>;
    type?: Nullable<ESearchType>;
    useNewSearch?: Nullable<boolean>;
    paginationInput?: Nullable<PaginationInput>;
}

export class PhoneNumberAccountExistInput {
    phoneNumber?: Nullable<string>;
}

export class GetInviteCodeInput {
    userId: string;
    action?: Nullable<InviteCodeAction>;
}

export class CheckAndRedeemInviteCodeInput {
    code: number;
}

export class GetCategoriesWithTypesInput {
    shouldAddUserPreferences?: Nullable<boolean>;
}

export class WildrAppConfigInput {
    osName?: Nullable<OSName>;
}

export class GetChallengesInput {
    type?: Nullable<ChallengeListType>;
    paginationInput: PaginationInput;
}

export class GetChallengeInput {
    id: string;
}

export class GetJoinedChallengesInput {
    challengeState?: Nullable<ChallengeState>;
}

export class GetMyChallengesInput {
    paginationInput: PaginationInput;
}

export class TransactionsConnectionInput {
    transactionFilter: TransactionFilter;
    paginationInput: PaginationInput;
}

export class WalletActivitiesConnectionInput {
    paginationInput: PaginationInput;
}

export class GetWalletInput {
    userId?: Nullable<string>;
}

export class TagInput {
    id?: Nullable<string>;
    name?: Nullable<string>;
    noSpace?: Nullable<boolean>;
}

export class SegmentPositionInput {
    position?: Nullable<number>;
    segmentType?: Nullable<SegmentType>;
}

export class TagSegmentInput {
    position?: Nullable<number>;
    tag?: Nullable<TagInput>;
}

export class UserSegmentInput {
    position?: Nullable<number>;
    userId?: Nullable<string>;
}

export class TextInput {
    chunk?: Nullable<string>;
    langCode?: Nullable<string>;
    noSpace?: Nullable<boolean>;
}

export class TextSegmentInput {
    position?: Nullable<number>;
    text?: Nullable<TextInput>;
}

export class ContentInput {
    segments?: Nullable<SegmentPositionInput[]>;
    textSegments?: Nullable<TextSegmentInput[]>;
    tagSegments?: Nullable<TagSegmentInput[]>;
    userSegments?: Nullable<UserSegmentInput[]>;
}

export class TextPostPropertiesInput {
    content?: Nullable<ContentInput>;
}

export class ImagePostPropertiesInput {
    image: Upload;
    thumbnail?: Nullable<Upload>;
}

export class VideoPostPropertiesInput {
    video: Upload;
    thumbnail?: Nullable<Upload>;
}

export class PostPropertiesInput {
    textInput?: Nullable<TextPostPropertiesInput>;
    imageInput?: Nullable<ImagePostPropertiesInput>;
    videoInput?: Nullable<VideoPostPropertiesInput>;
}

export class CreateMultiMediaPostInput {
    expirationHourCount?: Nullable<number>;
    commenterScope?: Nullable<CommenterScope>;
    visibility?: Nullable<PostVisibility>;
    caption?: Nullable<ContentInput>;
    thumbnail?: Nullable<Upload>;
    tags?: Nullable<TagInput[]>;
    mentions?: Nullable<string[]>;
    properties?: Nullable<PostPropertiesInput[]>;
    shouldBypassTrollDetection?: Nullable<boolean>;
    negativeIndices?: Nullable<Nullable<number>[]>;
    negativeResults?: Nullable<Nullable<number>[]>;
    accessControl?: Nullable<PostAccessControl>;
    challengeId?: Nullable<string>;
}

export class CreateTextPostInput {
    expirationHourCount?: Nullable<number>;
    commenterScope?: Nullable<CommenterScope>;
    visibility?: Nullable<PostVisibility>;
    content?: Nullable<ContentInput>;
    tags?: Nullable<TagInput[]>;
}

export class CreateImagePostInput {
    expirationHourCount?: Nullable<number>;
    commenterScope?: Nullable<CommenterScope>;
    visibility?: Nullable<PostVisibility>;
    image: Upload;
    thumbnail?: Nullable<Upload>;
    content?: Nullable<ContentInput>;
    tags?: Nullable<TagInput[]>;
    mentions?: Nullable<string[]>;
}

export class UploadImageInput {
    image: Upload;
}

export class UploadVideoInput {
    video: Upload;
}

export class CreateVideoPostInput {
    expirationHourCount?: Nullable<number>;
    commenterScope?: Nullable<CommenterScope>;
    visibility?: Nullable<PostVisibility>;
    video: Upload;
    thumbnail?: Nullable<Upload>;
    content?: Nullable<ContentInput>;
    tags?: Nullable<TagInput[]>;
    mentions?: Nullable<string[]>;
}

export class RepostInput {
    postId: string;
    expirationHourCount?: Nullable<number>;
    caption?: Nullable<ContentInput>;
    shouldBypassTrollDetection?: Nullable<boolean>;
    negativeIndices?: Nullable<Nullable<number>[]>;
    negativeResults?: Nullable<Nullable<number>[]>;
    accessControl?: Nullable<PostAccessControl>;
}

export class SharePostInput {
    postId: string;
}

export class ReactOnPostInput {
    postId: string;
    reaction: ReactionType;
}

export class ReactOnCommentInput {
    commentId: string;
    reaction: ReactionType;
}

export class FlagCommentInput {
    commentId: string;
    operation: FlagOperationType;
}

export class ReactOnReplyInput {
    replyId: string;
    reaction: ReactionType;
}

export class UpdateCommentParticipationInput {
    commentId?: Nullable<string>;
    type?: Nullable<ParticipationType>;
}

export class PinCommentInput {
    postId?: Nullable<string>;
    challengeId?: Nullable<string>;
    commentId?: Nullable<string>;
}

export class ReportUserInput {
    userId: string;
    type: ReportType;
}

export class ReportCommentInput {
    commentId: string;
    type: ReportType;
}

export class ReportReplyInput {
    replyId: string;
    type: ReportType;
}

export class ReportPostInput {
    postId: string;
    type: ReportType;
}

export class DeletePostInput {
    postId: string;
}

export class DeleteCommentInput {
    commentId: string;
}

export class DeleteReplyInput {
    replyId: string;
}

export class FollowUserInput {
    userId: string;
}

export class UnfollowUserInput {
    userId: string;
}

export class RemoveFollowerInput {
    userId: string;
}

export class BlockUserInput {
    userId?: Nullable<string>;
}

export class UnblockUserInput {
    userId?: Nullable<string>;
}

export class BlockCommenterOnPostInput {
    operation: BlockOperationType;
    commenterId: string;
    postId: string;
}

export class AddCommentInput {
    postId?: Nullable<string>;
    challengeId?: Nullable<string>;
    content: ContentInput;
    participationType?: Nullable<ParticipationType>;
    shouldBypassTrollDetection?: Nullable<boolean>;
    negativeConfidenceCount?: Nullable<number>;
}

export class AddReplyInput {
    commentId: string;
    content: ContentInput;
    shouldBypassTrollDetection?: Nullable<boolean>;
    negativeConfidenceCount?: Nullable<number>;
}

export class MediaSourceInput {
    uri?: Nullable<URL>;
}

export class FirebaseAuthEmailInput {
    email?: Nullable<string>;
    displayName?: Nullable<string>;
    phoneNumber?: Nullable<string>;
    photoUrl?: Nullable<string>;
    uid: string;
    canSignup?: Nullable<boolean>;
    fcmToken?: Nullable<string>;
}

export class FirebaseAuthPhoneNumberInput {
    phoneNumber: string;
    displayName?: Nullable<string>;
    email?: Nullable<string>;
    photoUrl?: Nullable<string>;
    uid: string;
    canSignup?: Nullable<boolean>;
    fcmToken?: Nullable<string>;
}

export class FirebaseSignupInput {
    email?: Nullable<string>;
    phoneNumber?: Nullable<string>;
    name?: Nullable<string>;
    handle: string;
    uid: string;
    gender?: Nullable<Gender>;
    language: string;
    image?: Nullable<Upload>;
    inviteCode?: Nullable<number>;
    fcmToken?: Nullable<string>;
    birthday?: Nullable<Date>;
    categoryIds?: Nullable<string[]>;
    linkData?: Nullable<LinkData>;
}

export class UpdateEmailInput {
    email: string;
}

export class UpdateNameInput {
    name: string;
}

export class UpdateHandleInput {
    handle: string;
}

export class UpdateFCMTokenInput {
    token: string;
}

export class UpdateBioInput {
    bio: string;
}

export class UpdatePronounInput {
    pronoun: string;
}

export class UpdatePhoneNumberInput {
    phoneNumber: string;
}

export class UpdateUserAvatarInput {
    image: Upload;
}

export class UserInput {
    id?: Nullable<string>;
    handle?: Nullable<string>;
    name?: Nullable<string>;
    email?: Nullable<string>;
    password?: Nullable<string>;
    phoneNumber?: Nullable<string>;
    avatarImage?: Nullable<MediaSourceInput>;
    gender?: Nullable<Gender>;
}

export class KeyValuePair {
    key: string;
    value: string;
}

export class LinkData {
    linkId: string;
    refererId: string;
    pseudoUserId: string;
    sourceId: string;
    sourceType: LinkSourceType;
    otherParams?: Nullable<KeyValuePair[]>;
}

export class SignUpWithPhoneNumberInput {
    handle: string;
    name: string;
    avatarImage?: Nullable<MediaSourceInput>;
    gender?: Nullable<Gender>;
    inviteCode?: Nullable<number>;
    fcmToken: string;
    linkData?: Nullable<LinkData>;
}

export class SignUpWithEmailInput {
    handle: string;
    name: string;
    avatarImage?: Nullable<MediaSourceInput>;
    gender: Gender;
    langCode: string;
    inviteCode?: Nullable<number>;
    fcmToken: string;
    linkData?: Nullable<LinkData>;
}

export class RealIdFaceData {
    faceSignature?: Nullable<Nullable<number>[]>;
}

export class RealIdFailedVerificationImageData {
    isSmiling?: Nullable<boolean>;
    image?: Nullable<Upload>;
    handGesture?: Nullable<RealIdHandGesture>;
}

export class UpdateRealIdVerificationInput {
    faceData: RealIdFaceData;
    faceImage: Upload;
    passFailState: PassFailState;
    realIdFailedVerificationImageData?: Nullable<Nullable<RealIdFailedVerificationImageData>[]>;
}

export class WildrVerifiedManualReviewInput {
    faceImage: Upload;
    manualReviewImage: Upload;
}

export class UpdateLastSeenCursorInput {
    timestamp: string;
    endCursor: string;
    isRefresh?: Nullable<boolean>;
    feedType?: Nullable<FeedType>;
    postType?: Nullable<PostKind>;
    scopeType?: Nullable<FeedScopeType>;
}

export class AddMemberToListInput {
    id: string;
    memberId: string;
}

export class AddMemberToInnerCircleInput {
    memberId: string;
}

export class RemoveMemberFromListInput {
    id: string;
    memberId: string;
}

export class RemoveMemberFromInnerCircleInput {
    memberId: string;
}

export class CreateUserListInput {
    name: string;
    icon?: Nullable<Upload>;
    iconUrl?: Nullable<string>;
}

export class DeleteUserListInput {
    id: string;
}

export class UpdateOnboardingInput {
    type: OnboardingType;
}

export class UpdateListVisibilityInput {
    follower: UserListVisibility;
    following: UserListVisibility;
}

export class ChallengeCoverImageInput {
    image: Upload;
    thumbnail?: Nullable<Upload>;
}

export class TrollDetectionOverrideData {
    message?: Nullable<string>;
    result?: Nullable<string>;
}

export class TrollDetectionOverride {
    name?: Nullable<TrollDetectionOverrideData>;
    description?: Nullable<TrollDetectionOverrideData>;
}

export class CreateChallengeInput {
    name: string;
    description?: Nullable<ContentInput>;
    coverImage?: Nullable<ChallengeCoverImageInput>;
    coverEnum?: Nullable<ChallengeCoverEnum>;
    categoryIds?: Nullable<Nullable<string>[]>;
    challengeLengthInDays?: Nullable<number>;
    startDate?: Nullable<DateTime>;
    endDate?: Nullable<DateTime>;
    trollDetectionOverride?: Nullable<TrollDetectionOverride>;
}

export class EditChallengeInput {
    id: string;
    name?: Nullable<string>;
    description?: Nullable<ContentInput>;
    coverImage?: Nullable<ChallengeCoverImageInput>;
    coverEnum?: Nullable<ChallengeCoverEnum>;
    deleteCoverImage?: Nullable<boolean>;
    categoryIds?: Nullable<Nullable<string>[]>;
    startDate?: Nullable<DateTime>;
    endDate?: Nullable<DateTime>;
    trollDetectionOverride?: Nullable<TrollDetectionOverride>;
}

export class JoinChallengeInput {
    id: string;
}

export class PinChallengeEntryInput {
    flag: ChallengeEntryPinFlag;
    challengeId: string;
    entryId: string;
}

export class LeaveChallengeInput {
    id: string;
}

export class PinCommentOnChallengeInput {
    challengeId: string;
    commentId: string;
}

export class UnPinCommentOnChallengeInput {
    challengeId: string;
}

export class ReportChallengeInput {
    challengeId: string;
    type: ReportType;
}

export class AddUserToWaitlistInput {
    waitlistType: WaitlistType;
}

export class AddEmailToWaitlistInput {
    email: string;
    waitlistType: WaitlistType;
}

export class SkipBannerInput {
    bannerId: string;
}

export class SendContactUsEmailInput {
    name: string;
    from: string;
    subject: string;
    body: string;
}

export class DetectTrollingInput {
    content: string;
}

export interface Node {
    id: string;
}

export interface ChallengeInteractionResult {
    challenge?: Nullable<Challenge>;
}

export interface FeedEntry {
    id: string;
    ts?: Nullable<Timestamps>;
}

export interface CommentEntry {
    id: string;
    ts?: Nullable<Timestamps>;
}

export interface Post extends Node {
    id: string;
    author?: Nullable<User>;
    ts?: Nullable<Timestamps>;
    commentsConnection?: Nullable<PostCommentsConnection>;
    realReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    applaudReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    likeReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    parentChallengeId?: Nullable<string>;
    isPinnedToChallenge?: Nullable<boolean>;
    isHiddenOnChallenge?: Nullable<boolean>;
    canComment?: Nullable<boolean>;
    postContext?: Nullable<PostContext>;
    stats?: Nullable<PostStats>;
    tags?: Nullable<Nullable<Tag>[]>;
    pinnedComment?: Nullable<Comment>;
    willBeDeleted?: Nullable<boolean>;
    isPrivate?: Nullable<boolean>;
    sensitiveStatus?: Nullable<SensitiveStatus>;
    accessControlContext?: Nullable<PostAccessControlContext>;
    accessControl?: Nullable<PostAccessControlData>;
    baseType?: Nullable<PostBaseType>;
    commentVisibilityAccessControlContext?: Nullable<CommentVisibilityAccessControlContext>;
    commentPostingAccessControlContext?: Nullable<CommentPostingAccessControlContext>;
    repostAccessControlContext?: Nullable<RepostAccessControlContext>;
}

export interface Error {
    message: string;
}

export class SmartError implements Error {
    __typename?: 'SmartError';
    message: string;
}

export class PostNotFoundError implements Error {
    __typename?: 'PostNotFoundError';
    message: string;
}

export class AskForHandleAndNameError implements Error {
    __typename?: 'AskForHandleAndNameError';
    message: string;
}

export class HandleAlreadyTakenError implements Error {
    __typename?: 'HandleAlreadyTakenError';
    message: string;
}

export class TrollDetectorError implements Error {
    __typename?: 'TrollDetectorError';
    message: string;
    data?: Nullable<string>;
    indices?: Nullable<Nullable<number>[]>;
    results?: Nullable<Nullable<string>[]>;
}

export class MediaSource {
    __typename?: 'MediaSource';
    uri?: Nullable<URL>;
}

export class Image {
    __typename?: 'Image';
    id: string;
    source?: Nullable<MediaSource>;
    type?: Nullable<ImageType>;
}

export class Video {
    __typename?: 'Video';
    id: string;
    source?: Nullable<MediaSource>;
    type?: Nullable<VideoType>;
}

export class Timestamps {
    __typename?: 'Timestamps';
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
    expiry?: Nullable<DateTime>;
    start?: Nullable<DateTime>;
}

export class Tag {
    __typename?: 'Tag';
    id: string;
    name?: Nullable<string>;
    noSpace?: Nullable<boolean>;
}

export class UserRef {
    __typename?: 'UserRef';
    id: string;
    handle?: Nullable<string>;
}

export class UserMention {
    __typename?: 'UserMention';
    id: string;
    User?: Nullable<UserRef>;
}

export class UserStats {
    __typename?: 'UserStats';
    followingCount?: Nullable<number>;
    followerCount?: Nullable<number>;
    postCount?: Nullable<number>;
    innerCircleCount?: Nullable<number>;
    joinedChallengesCount?: Nullable<number>;
    createdChallengesCount?: Nullable<number>;
}

export class UserStrikeData {
    __typename?: 'UserStrikeData';
    score?: Nullable<number>;
    isFaded?: Nullable<boolean>;
    currentStrikeCount?: Nullable<number>;
    firstStrikeCount?: Nullable<number>;
    firstStrikeTS?: Nullable<DateTime>;
    firstStrikeExpiryTS?: Nullable<DateTime>;
    secondStrikeCount?: Nullable<number>;
    secondStrikeTS?: Nullable<DateTime>;
    secondStrikeExpiryTS?: Nullable<DateTime>;
    thirdStrikeCount?: Nullable<number>;
    thirdStrikeTS?: Nullable<DateTime>;
    thirdStrikeExpiryTS?: Nullable<DateTime>;
    permanentSuspensionCount?: Nullable<number>;
    finalStrikeTimeStamps?: Nullable<Nullable<DateTime>[]>;
}

export class FollowerEdge {
    __typename?: 'FollowerEdge';
    isFollowing?: Nullable<boolean>;
}

export class UserEdge {
    __typename?: 'UserEdge';
    cursor: string;
    node: User;
}

export class UserConnection {
    __typename?: 'UserConnection';
    pageInfo: PageInfo;
    edges?: Nullable<UserEdge[]>;
}

export class TagEdge {
    __typename?: 'TagEdge';
    cursor: string;
    node: Tag;
}

export class TagConnection {
    __typename?: 'TagConnection';
    pageInfo: PageInfo;
    edges?: Nullable<TagEdge[]>;
}

export class UserPostsEdge {
    __typename?: 'UserPostsEdge';
    cursor: string;
    node: Post;
}

export class UserPostsConnection {
    __typename?: 'UserPostsConnection';
    pageInfo: PageInfo;
    edges?: Nullable<UserPostsEdge[]>;
}

export class UserFollowersEdge {
    __typename?: 'UserFollowersEdge';
    cursor: string;
    node: User;
}

export class UserFollowersList {
    __typename?: 'UserFollowersList';
    pageInfo: PageInfo;
    edges?: Nullable<UserFollowersEdge[]>;
}

export class UserFollowingsEdge {
    __typename?: 'UserFollowingsEdge';
    cursor: string;
    node: User;
}

export class UserFollowingsList {
    __typename?: 'UserFollowingsList';
    pageInfo: PageInfo;
    edges?: Nullable<UserFollowingsEdge[]>;
}

export class BlockedUsersEdge {
    __typename?: 'BlockedUsersEdge';
    cursor: string;
    node: User;
}

export class BlockedUsersList {
    __typename?: 'BlockedUsersList';
    pageInfo: PageInfo;
    edges?: Nullable<BlockedUsersEdge[]>;
}

export class ReviewReportRequest {
    __typename?: 'ReviewReportRequest';
    id: string;
    readableId?: Nullable<string>;
    createdAt?: Nullable<Timestamp>;
    updatedAt?: Nullable<Timestamp>;
    comment?: Nullable<string>;
    violatedGuideline?: Nullable<ViolatedGuideline>;
    link?: Nullable<string>;
}

export class PostCategory {
    __typename?: 'PostCategory';
    id: string;
    value?: Nullable<string>;
    type?: Nullable<string>;
}

export class UpdateCategoryInterestsResult {
    __typename?: 'UpdateCategoryInterestsResult';
    success?: Nullable<boolean>;
}

export class PostType {
    __typename?: 'PostType';
    value?: Nullable<number>;
    name?: Nullable<string>;
}

export class UpdatePostTypeInterestsResult {
    __typename?: 'UpdatePostTypeInterestsResult';
    success?: Nullable<boolean>;
}

export class UserLinks {
    __typename?: 'UserLinks';
    inviteLink: string;
    innerCircleInviteLink: string;
}

export class InviteNode {
    __typename?: 'InviteNode';
    user?: Nullable<User>;
    state?: Nullable<InviteState>;
}

export class InviteEdge {
    __typename?: 'InviteEdge';
    cursor: string;
    node: InviteNode;
}

export class InvitesConnection {
    __typename?: 'InvitesConnection';
    pageInfo: PageInfo;
    edges?: Nullable<InviteEdge[]>;
}

export class User {
    __typename?: 'User';
    id: string;
    ts?: Nullable<Timestamps>;
    handle?: Nullable<string>;
    name?: Nullable<string>;
    email?: Nullable<string>;
    password?: Nullable<string>;
    phoneNumber?: Nullable<string>;
    avatarImage?: Nullable<MediaSource>;
    gender?: Nullable<Gender>;
    stats?: Nullable<UserStats>;
    currentUserContext?: Nullable<UserContext>;
    postsConnection?: Nullable<UserPostsConnection>;
    followersList?: Nullable<UserFollowersList>;
    followingsList?: Nullable<UserFollowingsList>;
    blockList?: Nullable<BlockedUsersList>;
    activitiesConnection?: Nullable<ActivitiesConnection>;
    hasBlocked?: Nullable<boolean>;
    isAvailable?: Nullable<boolean>;
    strikeData?: Nullable<UserStrikeData>;
    commentEnabledAt?: Nullable<DateTime>;
    commentOnboardedAt?: Nullable<DateTime>;
    userCreatedAt?: Nullable<DateTime>;
    score?: Nullable<number>;
    isSuspended?: Nullable<boolean>;
    embargoExpirationDaysDelta?: Nullable<number>;
    realIdVerificationStatus?: Nullable<RealIdVerificationStatus>;
    realIdFace?: Nullable<MediaSource>;
    remainingInvitesCount?: Nullable<number>;
    bio?: Nullable<string>;
    pronoun?: Nullable<string>;
    hasPersonalizedFeed?: Nullable<boolean>;
    allCreatedLists?: Nullable<UserLists>;
    innerCircleList?: Nullable<UserListWithMembers>;
    singleList?: Nullable<UserListWithMembers>;
    onboardingStats?: Nullable<OnboardingStats>;
    visibilityPreferences?: Nullable<VisibilityPreferences>;
    links?: Nullable<UserLinks>;
    wallet?: Nullable<Wallet>;
    invitesConnection?: Nullable<InvitesConnection>;
}

export class OnboardingStats {
    __typename?: 'OnboardingStats';
    innerCircle?: Nullable<boolean>;
    commentReplyLikes?: Nullable<boolean>;
    challenges?: Nullable<boolean>;
    challengeAuthorInteractions?: Nullable<boolean>;
    challengeEducation?: Nullable<boolean>;
}

export class VisibilityPreferences {
    __typename?: 'VisibilityPreferences';
    list?: Nullable<ListVisibility>;
}

export class ListVisibility {
    __typename?: 'ListVisibility';
    follower?: Nullable<UserListVisibility>;
    following?: Nullable<UserListVisibility>;
}

export class UserList {
    __typename?: 'UserList';
    id?: Nullable<string>;
    name?: Nullable<string>;
    iconUrl?: Nullable<string>;
    memberCount?: Nullable<number>;
}

export class UserListMembersEdge {
    __typename?: 'UserListMembersEdge';
    cursor: string;
    node: User;
}

export class UserListMembersList {
    __typename?: 'UserListMembersList';
    pageInfo: PageInfo;
    edges?: Nullable<UserListMembersEdge[]>;
}

export class UserListsEdge {
    __typename?: 'UserListsEdge';
    cursor: string;
    node: UserList;
}

export class UserLists {
    __typename?: 'UserLists';
    pageInfo: PageInfo;
    edges?: Nullable<UserListsEdge[]>;
}

export class UserListWithMembers {
    __typename?: 'UserListWithMembers';
    details?: Nullable<UserList>;
    isSuggestion?: Nullable<boolean>;
    members?: Nullable<UserListMembersList>;
}

export class PostStats {
    __typename?: 'PostStats';
    likeCount: number;
    realCount: number;
    applauseCount: number;
    shareCount: number;
    repostCount: number;
    commentCount: number;
    reportCount: number;
    hasHiddenComments: boolean;
}

export class CommentStats {
    __typename?: 'CommentStats';
    likeCount?: Nullable<number>;
    replyCount?: Nullable<number>;
    reportCount?: Nullable<number>;
}

export class ReplyStats {
    __typename?: 'ReplyStats';
    likeCount?: Nullable<number>;
    reportCount?: Nullable<number>;
}

export class PostCommentContext {
    __typename?: 'PostCommentContext';
    liked?: Nullable<boolean>;
}

export class CommentContext {
    __typename?: 'CommentContext';
    liked?: Nullable<boolean>;
}

export class CommentReplyContext {
    __typename?: 'CommentReplyContext';
    liked?: Nullable<boolean>;
}

export class ReplyContext {
    __typename?: 'ReplyContext';
    liked?: Nullable<boolean>;
}

export class UserContext {
    __typename?: 'UserContext';
    followingUser?: Nullable<boolean>;
    isInnerCircle?: Nullable<boolean>;
}

export class PostContext {
    __typename?: 'PostContext';
    liked?: Nullable<boolean>;
    realed?: Nullable<boolean>;
    applauded?: Nullable<boolean>;
}

export class PageInfo {
    __typename?: 'PageInfo';
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor?: Nullable<string>;
    endCursor?: Nullable<string>;
    pageNumber?: Nullable<number>;
    count?: Nullable<number>;
    totalCount?: Nullable<number>;
}

export class FeedPostsEdge {
    __typename?: 'FeedPostsEdge';
    cursor: string;
    node: Post;
}

export class FeedPostsConnection {
    __typename?: 'FeedPostsConnection';
    pageInfo: PageInfo;
    edges?: Nullable<FeedPostsEdge[]>;
}

export class Feed {
    __typename?: 'Feed';
    id: string;
    ts?: Nullable<Timestamps>;
    postsConnection?: Nullable<FeedPostsConnection>;
    messageCount?: Nullable<number>;
}

export class Reply implements Node {
    __typename?: 'Reply';
    id: string;
    ts?: Nullable<Timestamps>;
    author?: Nullable<User>;
    body?: Nullable<Content>;
    replyStats?: Nullable<ReplyStats>;
    commentReplyContext?: Nullable<CommentReplyContext>;
    replyContext?: Nullable<ReplyContext>;
    reactionsConnection?: Nullable<ReplyReactionsConnection>;
}

export class ReplyReactionsEdge {
    __typename?: 'ReplyReactionsEdge';
    cursor: string;
    node: User;
}

export class ReplyReactionsConnection {
    __typename?: 'ReplyReactionsConnection';
    pageInfo: PageInfo;
    edges?: Nullable<ReplyReactionsEdge[]>;
    count: number;
}

export class Comment implements Node {
    __typename?: 'Comment';
    id: string;
    ts?: Nullable<Timestamps>;
    author?: Nullable<User>;
    body?: Nullable<Content>;
    commentStats?: Nullable<CommentStats>;
    commentContext?: Nullable<CommentContext>;
    postCommentContext?: Nullable<PostCommentContext>;
    repliesConnection?: Nullable<CommentRepliesConnection>;
    reactionsConnection?: Nullable<CommentReactionsConnection>;
    participationType?: Nullable<ParticipationType>;
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

export class PostCommentsConnection {
    __typename?: 'PostCommentsConnection';
    pageInfo: PageInfo;
    edges?: Nullable<PostCommentsEdge[]>;
    targetCommentError?: Nullable<string>;
}

export class CommentRepliesConnection {
    __typename?: 'CommentRepliesConnection';
    pageInfo: PageInfo;
    edges?: Nullable<CommentRepliesEdge[]>;
    targetReplyError?: Nullable<string>;
}

export class CommentReactionsEdge {
    __typename?: 'CommentReactionsEdge';
    cursor: string;
    node: User;
}

export class CommentReactionsConnection {
    __typename?: 'CommentReactionsConnection';
    pageInfo: PageInfo;
    count: number;
    edges?: Nullable<CommentReactionsEdge[]>;
}

export class UsersListEdge {
    __typename?: 'UsersListEdge';
    cursor: string;
    node: User;
}

export class PostReactorsListConnection {
    __typename?: 'PostReactorsListConnection';
    pageInfo: PageInfo;
    count?: Nullable<number>;
    edges?: Nullable<UsersListEdge[]>;
}

export class Language {
    __typename?: 'Language';
    code?: Nullable<string>;
}

export class Text {
    __typename?: 'Text';
    chunk?: Nullable<string>;
    lang?: Nullable<Language>;
    noSpace?: Nullable<boolean>;
}

export class Content {
    __typename?: 'Content';
    body?: Nullable<string>;
    wordCount?: Nullable<number>;
    lang?: Nullable<Language>;
    segments?: Nullable<ContentSegment[]>;
}

export class TextPostProperties {
    __typename?: 'TextPostProperties';
    content?: Nullable<Content>;
}

export class ImagePostProperties {
    __typename?: 'ImagePostProperties';
    image?: Nullable<Image>;
    thumbnail?: Nullable<Image>;
}

export class VideoPostProperties {
    __typename?: 'VideoPostProperties';
    video?: Nullable<Video>;
    thumbnail?: Nullable<Image>;
}

export class RepostedPostsEdge {
    __typename?: 'RepostedPostsEdge';
    cursor: string;
    node: Post;
}

export class RepostedPostsList {
    __typename?: 'RepostedPostsList';
    pageInfo: PageInfo;
    edges?: Nullable<RepostedPostsEdge[]>;
}

export class RepostMeta {
    __typename?: 'RepostMeta';
    count?: Nullable<number>;
    isParentPostDeleted?: Nullable<boolean>;
    repostedPosts?: Nullable<RepostedPostsList>;
    parentPost?: Nullable<Post>;
}

export class MultiMediaPost implements Node, Post, FeedEntry {
    __typename?: 'MultiMediaPost';
    id: string;
    parentChallenge?: Nullable<Challenge>;
    ts?: Nullable<Timestamps>;
    author?: Nullable<User>;
    commentsConnection?: Nullable<PostCommentsConnection>;
    realReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    applaudReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    likeReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    parentChallengeId?: Nullable<string>;
    isPinnedToChallenge?: Nullable<boolean>;
    isHiddenOnChallenge?: Nullable<boolean>;
    postContext?: Nullable<PostContext>;
    stats?: Nullable<PostStats>;
    tags?: Nullable<Nullable<Tag>[]>;
    canComment?: Nullable<boolean>;
    accessControlContext?: Nullable<PostAccessControlContext>;
    accessControl?: Nullable<PostAccessControlData>;
    pinnedComment?: Nullable<Comment>;
    thumbnail?: Nullable<Image>;
    caption?: Nullable<Content>;
    properties?: Nullable<Nullable<PostProperties>[]>;
    willBeDeleted?: Nullable<boolean>;
    isPrivate?: Nullable<boolean>;
    sensitiveStatus?: Nullable<SensitiveStatus>;
    repostMeta?: Nullable<RepostMeta>;
    baseType?: Nullable<PostBaseType>;
    commentVisibilityAccessControlContext?: Nullable<CommentVisibilityAccessControlContext>;
    commentPostingAccessControlContext?: Nullable<CommentPostingAccessControlContext>;
    repostAccessControlContext?: Nullable<RepostAccessControlContext>;
}

export class PostAccessControlData {
    __typename?: 'PostAccessControlData';
    postVisibility?: Nullable<PostVisibilityAccess>;
    commentVisibilityAccess?: Nullable<CommentVisibilityAccess>;
    commentPostingAccess?: Nullable<CommentPostingAccess>;
    repostAccess?: Nullable<RepostAccess>;
}

export class PostAccessControlContext {
    __typename?: 'PostAccessControlContext';
    postVisibility?: Nullable<PostVisibilityAccess>;
    commentVisibilityAccess?: Nullable<CommentVisibilityAccess>;
    commentPostingAccess?: Nullable<CommentPostingAccess>;
    canComment?: Nullable<boolean>;
    cannotCommentErrorMessage?: Nullable<string>;
    canViewComment?: Nullable<boolean>;
    cannotViewCommentErrorMessage?: Nullable<string>;
    canRepost?: Nullable<boolean>;
    cannotRepostErrorMessage?: Nullable<string>;
}

export class CommentVisibilityAccessControlContext {
    __typename?: 'CommentVisibilityAccessControlContext';
    commentVisibilityAccess?: Nullable<CommentVisibilityAccess>;
    canViewComment?: Nullable<boolean>;
    cannotViewCommentErrorMessage?: Nullable<string>;
}

export class CommentPostingAccessControlContext {
    __typename?: 'CommentPostingAccessControlContext';
    commentPostingAccess?: Nullable<CommentPostingAccess>;
    canComment?: Nullable<boolean>;
    cannotCommentErrorMessage?: Nullable<string>;
}

export class RepostAccessControlContext {
    __typename?: 'RepostAccessControlContext';
    canRepost?: Nullable<boolean>;
    hasReposted?: Nullable<boolean>;
    cannotRepostErrorMessage?: Nullable<string>;
}

export class TextPost implements Node, Post, FeedEntry {
    __typename?: 'TextPost';
    id: string;
    willBeDeleted?: Nullable<boolean>;
    ts?: Nullable<Timestamps>;
    author?: Nullable<User>;
    commentsConnection?: Nullable<PostCommentsConnection>;
    realReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    applaudReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    likeReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    parentChallengeId?: Nullable<string>;
    isPinnedToChallenge?: Nullable<boolean>;
    isHiddenOnChallenge?: Nullable<boolean>;
    postContext?: Nullable<PostContext>;
    canComment?: Nullable<boolean>;
    stats?: Nullable<PostStats>;
    tags?: Nullable<Nullable<Tag>[]>;
    content?: Nullable<Content>;
    pinnedComment?: Nullable<Comment>;
    isPrivate?: Nullable<boolean>;
    sensitiveStatus?: Nullable<SensitiveStatus>;
    accessControlContext?: Nullable<PostAccessControlContext>;
    accessControl?: Nullable<PostAccessControlData>;
    baseType?: Nullable<PostBaseType>;
    commentVisibilityAccessControlContext?: Nullable<CommentVisibilityAccessControlContext>;
    commentPostingAccessControlContext?: Nullable<CommentPostingAccessControlContext>;
    repostAccessControlContext?: Nullable<RepostAccessControlContext>;
}

export class ImagePost implements Node, Post, FeedEntry {
    __typename?: 'ImagePost';
    id: string;
    willBeDeleted?: Nullable<boolean>;
    ts?: Nullable<Timestamps>;
    author?: Nullable<User>;
    commentsConnection?: Nullable<PostCommentsConnection>;
    realReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    applaudReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    likeReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    parentChallengeId?: Nullable<string>;
    isPinnedToChallenge?: Nullable<boolean>;
    isHiddenOnChallenge?: Nullable<boolean>;
    canComment?: Nullable<boolean>;
    postContext?: Nullable<PostContext>;
    stats?: Nullable<PostStats>;
    tags?: Nullable<Nullable<Tag>[]>;
    image?: Nullable<Image>;
    thumbnail?: Nullable<Image>;
    caption?: Nullable<Content>;
    pinnedComment?: Nullable<Comment>;
    isPrivate?: Nullable<boolean>;
    sensitiveStatus?: Nullable<SensitiveStatus>;
    accessControlContext?: Nullable<PostAccessControlContext>;
    accessControl?: Nullable<PostAccessControlData>;
    baseType?: Nullable<PostBaseType>;
    commentVisibilityAccessControlContext?: Nullable<CommentVisibilityAccessControlContext>;
    commentPostingAccessControlContext?: Nullable<CommentPostingAccessControlContext>;
    repostAccessControlContext?: Nullable<RepostAccessControlContext>;
}

export class VideoPost implements Node, Post, FeedEntry {
    __typename?: 'VideoPost';
    id: string;
    willBeDeleted?: Nullable<boolean>;
    ts?: Nullable<Timestamps>;
    author?: Nullable<User>;
    commentsConnection?: Nullable<PostCommentsConnection>;
    realReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    applaudReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    likeReactorsUserListConnection?: Nullable<PostReactorsListConnection>;
    parentChallengeId?: Nullable<string>;
    isPinnedToChallenge?: Nullable<boolean>;
    isHiddenOnChallenge?: Nullable<boolean>;
    canComment?: Nullable<boolean>;
    postContext?: Nullable<PostContext>;
    stats?: Nullable<PostStats>;
    tags?: Nullable<Nullable<Tag>[]>;
    video?: Nullable<Video>;
    thumbnail?: Nullable<Image>;
    caption?: Nullable<Content>;
    pinnedComment?: Nullable<Comment>;
    isPrivate?: Nullable<boolean>;
    sensitiveStatus?: Nullable<SensitiveStatus>;
    accessControlContext?: Nullable<PostAccessControlContext>;
    accessControl?: Nullable<PostAccessControlData>;
    baseType?: Nullable<PostBaseType>;
    commentVisibilityAccessControlContext?: Nullable<CommentVisibilityAccessControlContext>;
    commentPostingAccessControlContext?: Nullable<CommentPostingAccessControlContext>;
    repostAccessControlContext?: Nullable<RepostAccessControlContext>;
}

export class Notification {
    __typename?: 'Notification';
    id: string;
    body?: Nullable<Content>;
}

export class GetFeedResult {
    __typename?: 'GetFeedResult';
    feed?: Nullable<Feed>;
}

export class GetUserResult {
    __typename?: 'GetUserResult';
    user?: Nullable<User>;
}

export class GetPostResult {
    __typename?: 'GetPostResult';
    post?: Nullable<Post>;
}

export class GetCommentResult {
    __typename?: 'GetCommentResult';
    comment?: Nullable<Comment>;
}

export class GetReplyResult {
    __typename?: 'GetReplyResult';
    reply?: Nullable<Reply>;
}

export class GetFollowersListResult {
    __typename?: 'GetFollowersListResult';
    user?: Nullable<User>;
}

export class GetFollowingsListResult {
    __typename?: 'GetFollowingsListResult';
    user?: Nullable<User>;
}

export class GetBlockListResult {
    __typename?: 'GetBlockListResult';
    user?: Nullable<User>;
}

export class SearchEdge {
    __typename?: 'SearchEdge';
    cursor: string;
    node: SearchNode;
}

export class SearchResult {
    __typename?: 'SearchResult';
    pageInfo: PageInfo;
    objectType?: Nullable<ObjectType>;
    result?: Nullable<SearchEdge[]>;
}

export class ESPostResult {
    __typename?: 'ESPostResult';
    post: Post;
}

export class ESResult {
    __typename?: 'ESResult';
    result?: Nullable<ESItem[]>;
    pageInfo?: Nullable<PageInfo>;
}

export class Activity implements Node {
    __typename?: 'Activity';
    id: string;
    type?: Nullable<ActivityType>;
    ts?: Nullable<Timestamps>;
    totalCount?: Nullable<number>;
    subjects?: Nullable<Nullable<User>[]>;
    object?: Nullable<ActivityObject>;
    verb?: Nullable<ActivityVerb>;
    objectType?: Nullable<ActivityObjectType>;
    miscObject?: Nullable<MiscObject>;
    displayStr?: Nullable<string>;
    displayBodyStr?: Nullable<string>;
    dataPayload?: Nullable<string>;
}

export class ActivitiesEdge {
    __typename?: 'ActivitiesEdge';
    cursor: string;
    node: Activity;
}

export class ActivitiesConnection {
    __typename?: 'ActivitiesConnection';
    pageInfo: PageInfo;
    edges?: Nullable<ActivitiesEdge[]>;
}

export class CheckEmailResult {
    __typename?: 'CheckEmailResult';
    doesExist?: Nullable<boolean>;
}

export class CheckHandleResult {
    __typename?: 'CheckHandleResult';
    doesExist?: Nullable<boolean>;
}

export class Check3rdPartyResult {
    __typename?: 'Check3rdPartyResult';
    doesExist?: Nullable<boolean>;
}

export class Get3rdPartyDetailsResult {
    __typename?: 'Get3rdPartyDetailsResult';
    name?: Nullable<string>;
    email?: Nullable<string>;
}

export class PhoneNumberAccountExistResult {
    __typename?: 'PhoneNumberAccountExistResult';
    phoneNumberAccountExist?: Nullable<boolean>;
}

export class SendEmailVerificationResult {
    __typename?: 'SendEmailVerificationResult';
    isSuccessful?: Nullable<boolean>;
}

export class GetInviteCodeResult {
    __typename?: 'GetInviteCodeResult';
    code?: Nullable<number>;
    user?: Nullable<User>;
}

export class CheckAndRedeemInviteCodeResult {
    __typename?: 'CheckAndRedeemInviteCodeResult';
    hasBeenRedeemed?: Nullable<boolean>;
    isValid?: Nullable<boolean>;
    payload?: Nullable<string>;
}

export class GetCategoriesResult {
    __typename?: 'GetCategoriesResult';
    categories: PostCategory[];
    userCategoryInterests?: Nullable<Nullable<string>[]>;
}

export class GetPostTypesResult {
    __typename?: 'GetPostTypesResult';
    postTypes: PostType[];
    userPostTypeInterests?: Nullable<Nullable<string>[]>;
}

export class CategoryTypeWithCategories {
    __typename?: 'CategoryTypeWithCategories';
    name?: Nullable<string>;
    categories: PostCategory[];
}

export class GetCategoriesWithTypesResult {
    __typename?: 'GetCategoriesWithTypesResult';
    categories: CategoryTypeWithCategories[];
}

export class IsEmailVerifiedResult {
    __typename?: 'IsEmailVerifiedResult';
    isEmailVerified: boolean;
}

export class WildrAppVersion {
    __typename?: 'WildrAppVersion';
    latest?: Nullable<string>;
    mandatory?: Nullable<string>;
}

export class WildrAppConfig {
    __typename?: 'WildrAppConfig';
    appVersion?: Nullable<WildrAppVersion>;
}

export class ChallengeStats {
    __typename?: 'ChallengeStats';
    entryCount: number;
    participantCount: number;
    commentCount: number;
    shareCount: number;
    reportCount: number;
}

export class ChallengeCoverImage {
    __typename?: 'ChallengeCoverImage';
    image?: Nullable<Image>;
    thumbnail?: Nullable<Image>;
}

export class ChallengeCover {
    __typename?: 'ChallengeCover';
    coverImage?: Nullable<ChallengeCoverImage>;
    coverImageEnum?: Nullable<ChallengeCoverEnum>;
}

export class ChallengeAuthorInteractionConnection {
    __typename?: 'ChallengeAuthorInteractionConnection';
    interactionCount: number;
}

export class ChallengeCommentEdge {
    __typename?: 'ChallengeCommentEdge';
    cursor: string;
    node: Comment;
}

export class ChallengeCommentsConnection {
    __typename?: 'ChallengeCommentsConnection';
    pageInfo: PageInfo;
    edges?: Nullable<ChallengeCommentEdge[]>;
    targetCommentError?: Nullable<string>;
}

export class ChallengeParticipant {
    __typename?: 'ChallengeParticipant';
    user: User;
    entryCount?: Nullable<number>;
    post?: Nullable<Post>;
    isFriend?: Nullable<boolean>;
    isCreator?: Nullable<boolean>;
}

export class ChallengeParticipantsEdge {
    __typename?: 'ChallengeParticipantsEdge';
    cursor: string;
    node: ChallengeParticipant;
}

export class ChallengePreviewParticipants {
    __typename?: 'ChallengePreviewParticipants';
    participants?: Nullable<User[]>;
    displayText?: Nullable<string>;
}

export class ChallengeParticipantsConnection {
    __typename?: 'ChallengeParticipantsConnection';
    pageInfo: PageInfo;
    edges?: Nullable<ChallengeParticipantsEdge[]>;
    targetParticipantError?: Nullable<string>;
}

export class ChallengeLeaderboardEdge {
    __typename?: 'ChallengeLeaderboardEdge';
    cursor: string;
    node: ChallengeParticipant;
}

export class ChallengeLeaderboardConnection {
    __typename?: 'ChallengeLeaderboardConnection';
    pageInfo: PageInfo;
    edges?: Nullable<ChallengeLeaderboardEdge[]>;
}

export class ChallengeEntryEdge {
    __typename?: 'ChallengeEntryEdge';
    cursor: string;
    node: Post;
}

export class ChallengeEntriesConnection {
    __typename?: 'ChallengeEntriesConnection';
    pageInfo: PageInfo;
    edges?: Nullable<ChallengeEntryEdge[]>;
    targetEntryError?: Nullable<string>;
    userToSearchForId?: Nullable<string>;
}

export class ChallengeTimestamps {
    __typename?: 'ChallengeTimestamps';
    startDate?: Nullable<DateTime>;
    endDate?: Nullable<DateTime>;
}

export class ChallengeCurrentUserContext {
    __typename?: 'ChallengeCurrentUserContext';
    isOwner?: Nullable<boolean>;
    hasJoined?: Nullable<boolean>;
}

export class Challenge implements Node {
    __typename?: 'Challenge';
    id: string;
    name: string;
    stats?: Nullable<ChallengeStats>;
    cover?: Nullable<ChallengeCover>;
    isCompleted?: Nullable<boolean>;
    description?: Nullable<Content>;
    isOwner?: Nullable<boolean>;
    author?: Nullable<User>;
    ts?: Nullable<Timestamps>;
    categories?: Nullable<Nullable<PostCategory>[]>;
    authorInteractionsConnection?: Nullable<ChallengeAuthorInteractionConnection>;
    commentsConnection?: Nullable<ChallengeCommentsConnection>;
    participantsConnection?: Nullable<ChallengeParticipantsConnection>;
    leaderboardConnection?: Nullable<ChallengeLeaderboardConnection>;
    todayEntriesConnection?: Nullable<ChallengeEntriesConnection>;
    featuredEntriesConnection?: Nullable<ChallengeEntriesConnection>;
    allEntriesConnection?: Nullable<ChallengeEntriesConnection>;
    userEntriesConnection?: Nullable<ChallengeEntriesConnection>;
    currentUserEntriesConnection?: Nullable<ChallengeEntriesConnection>;
    previewParticipants?: Nullable<ChallengePreviewParticipants>;
    willBeDeleted?: Nullable<boolean>;
    currentUserContext?: Nullable<ChallengeCurrentUserContext>;
    pinnedCommentId?: Nullable<string>;
    pinnedComment?: Nullable<Comment>;
    commentPostingAccessControlContext?: Nullable<CommentPostingAccessControlContext>;
    commentVisibilityAccessControlContext?: Nullable<CommentVisibilityAccessControlContext>;
}

export class ChallengeEdge {
    __typename?: 'ChallengeEdge';
    cursor: string;
    node: Challenge;
}

export class GetChallengesResult {
    __typename?: 'GetChallengesResult';
    pageInfo: PageInfo;
    edges?: Nullable<ChallengeEdge[]>;
}

export class GetChallengeResult {
    __typename?: 'GetChallengeResult';
    challenge: Challenge;
}

export class GetJoinedChallengesResult {
    __typename?: 'GetJoinedChallengesResult';
    challenges?: Nullable<Nullable<Challenge>[]>;
}

export class GetMyChallengesResult {
    __typename?: 'GetMyChallengesResult';
    pageInfo: PageInfo;
    edges?: Nullable<ChallengeEdge[]>;
}

export class FeatureFlagsResult {
    __typename?: 'FeatureFlagsResult';
    createPostV1?: Nullable<boolean>;
    createPostV2?: Nullable<boolean>;
    coinDashboardPart1?: Nullable<boolean>;
    coinDashboardPart2?: Nullable<boolean>;
    videoCompressionRes960x540Quality?: Nullable<boolean>;
    bannersEnabled?: Nullable<boolean>;
}

export class Banner {
    __typename?: 'Banner';
    id: string;
    title: string;
    description: string;
    cta: string;
    asset?: Nullable<Image>;
    route: PageRoute;
}

export class BannersConnection {
    __typename?: 'BannersConnection';
    banners?: Nullable<Banner[]>;
}

export class WildrBot {
    __typename?: 'WildrBot';
    handle: string;
}

export class AwardTransactionType {
    __typename?: 'AwardTransactionType';
    type: AwardTransactionType;
}

export class TransactionFailureDetails {
    __typename?: 'TransactionFailureDetails';
    reason: TransactionFailureReason;
    message: string;
}

export class TransactionHistoryEvent {
    __typename?: 'TransactionHistoryEvent';
    status: TransactionStatus;
    createdAt: DateTime;
    failureDetails?: Nullable<TransactionFailureDetails>;
}

export class Transaction {
    __typename?: 'Transaction';
    id: string;
    type: TransactionType;
    amount: number;
    sender: TransactionSender;
    recipient: User;
    status: TransactionStatus;
    history?: Nullable<TransactionHistoryEvent[]>;
}

export class TransactionEdge {
    __typename?: 'TransactionEdge';
    cursor: string;
    node: Transaction;
}

export class TransactionsConnection {
    __typename?: 'TransactionsConnection';
    pageInfo: PageInfo;
    edges?: Nullable<TransactionEdge[]>;
}

export class WalletActivity implements Node {
    __typename?: 'WalletActivity';
    id: string;
    displayStr: string;
    asset: Image;
    route: PageRoute;
}

export class WalletActivityEdge {
    __typename?: 'WalletActivityEdge';
    cursor: string;
    node: WalletActivity;
}

export class WalletActivitiesConnection {
    __typename?: 'WalletActivitiesConnection';
    pageInfo: PageInfo;
    edges?: Nullable<WalletActivityEdge[]>;
}

export class WalletBalances {
    __typename?: 'WalletBalances';
    current: number;
    available: number;
    pending: number;
}

export class Wallet {
    __typename?: 'Wallet';
    id: string;
    balances: WalletBalances;
    transactionsConnection?: Nullable<TransactionsConnection>;
    walletActivitiesConnection?: Nullable<WalletActivitiesConnection>;
}

export class GetWalletResult {
    __typename?: 'GetWalletResult';
    wallet?: Nullable<Wallet>;
}

export class WalletTransactionNestedRoute {
    __typename?: 'WalletTransactionNestedRoute';
    transactionId: string;
}

export class WalletPageRoute {
    __typename?: 'WalletPageRoute';
    walletId?: Nullable<string>;
    nestedRoute?: Nullable<WalletNestedRoute>;
}

export class GetWebAppFeatureFlagsResult {
    __typename?: 'GetWebAppFeatureFlagsResult';
    wildrCoinWaitlistEnabled: boolean;
}

export abstract class IQuery {
    __typename?: 'IQuery';

    abstract getFeed(input?: Nullable<GetFeedInput>): Nullable<GetFeedOutput> | Promise<Nullable<GetFeedOutput>>;

    abstract getComment(input: GetCommentInput): Nullable<GetCommentOutput> | Promise<Nullable<GetCommentOutput>>;

    abstract getReply(input: GetReplyInput): Nullable<GetReplyOutput> | Promise<Nullable<GetReplyOutput>>;

    abstract getPost(input?: Nullable<GetPostInput>): Nullable<GetPostOutput> | Promise<Nullable<GetPostOutput>>;

    abstract getUser(input: GetUserInput): GetUserOutput | Promise<GetUserOutput>;

    abstract search(input: SearchInput): SearchOutput | Promise<SearchOutput>;

    abstract getFollowersList(input: GetFollowersListInput): GetFollowersListOutput | Promise<GetFollowersListOutput>;

    abstract getFollowingsList(input: GetFollowingsListInput): GetFollowingsListOutput | Promise<GetFollowingsListOutput>;

    abstract getBlockList(input: GetBlockListInput): GetBlockListOutput | Promise<GetBlockListOutput>;

    abstract elasticSearch(input: ESInput): ESOutput | Promise<ESOutput>;

    abstract checkEmail(email: string): CheckEmailOutput | Promise<CheckEmailOutput>;

    abstract checkHandle(handle: string): Nullable<CheckHandleOutput> | Promise<Nullable<CheckHandleOutput>>;

    abstract check3rdParty(uid: string, providerId: string): Check3rdPartyOutput | Promise<Check3rdPartyOutput>;

    abstract getDetailsFrom3rdPartyUid(uid: string, providerId: string): Get3rdPartyDetailsOutput | Promise<Get3rdPartyDetailsOutput>;

    abstract checkPhoneNumberAccountExists(input: PhoneNumberAccountExistInput): Nullable<PhoneNumberUserExistsOutput> | Promise<Nullable<PhoneNumberUserExistsOutput>>;

    abstract getInviteCode(input: GetInviteCodeInput): Nullable<GetInviteCodeOutput> | Promise<Nullable<GetInviteCodeOutput>>;

    abstract checkAndRedeemInviteCode(input: CheckAndRedeemInviteCodeInput): Nullable<CheckAndRedeemInviteCodeOutput> | Promise<Nullable<CheckAndRedeemInviteCodeOutput>>;

    abstract sendEmailVerificationLink(input: string): Nullable<SendEmailVerificationOutput> | Promise<Nullable<SendEmailVerificationOutput>>;

    abstract getCategories(input: string): GetCategoriesOutput | Promise<GetCategoriesOutput>;

    abstract getPostTypes(input: string): GetPostTypesOutput | Promise<GetPostTypesOutput>;

    abstract getStrikeReport(input: GetStrikeReportInput): GetStrikeReportOutput | Promise<GetStrikeReportOutput>;

    abstract isEmailVerified(input?: Nullable<string>): IsEmailVerifiedOutput | Promise<IsEmailVerifiedOutput>;

    abstract getWildrAppConfig(input: WildrAppConfigInput): WildrAppConfigOutput | Promise<WildrAppConfigOutput>;

    abstract getChallenges(input: GetChallengesInput): GetChallengesOutput | Promise<GetChallengesOutput>;

    abstract getChallenge(input: GetChallengeInput): GetChallengeOutput | Promise<GetChallengeOutput>;

    abstract getCategoriesWithTypes(input: GetCategoriesWithTypesInput): GetCategoriesWithTypesOutput | Promise<GetCategoriesWithTypesOutput>;

    abstract getJoinedChallenges(input: GetJoinedChallengesInput): GetJoinedChallengesOutput | Promise<GetJoinedChallengesOutput>;

    abstract getMyChallenges(input: GetMyChallengesInput): GetMyChallengesOutput | Promise<GetMyChallengesOutput>;

    abstract getFeatureFlags(): GetFeatureFlagsOutput | Promise<GetFeatureFlagsOutput>;

    abstract getBanners(): BannersConnection | Promise<BannersConnection>;

    abstract getWallet(input: GetWalletInput): GetWalletOutput | Promise<GetWalletOutput>;

    abstract getWebAppFeatureFlags(): GetWebAppFeatureFlagsOutput | Promise<GetWebAppFeatureFlagsOutput>;
}

export class UploadImageOutput {
    __typename?: 'UploadImageOutput';
    id: string;
}

export class UploadVideoOutput {
    __typename?: 'UploadVideoOutput';
    id: string;
}

export class CreatePostResult {
    __typename?: 'CreatePostResult';
    post: Post;
}

export class RepostResult {
    __typename?: 'RepostResult';
    post?: Nullable<Post>;
}

export class SharePostOutput {
    __typename?: 'SharePostOutput';
    post?: Nullable<Post>;
}

export class ReactOnPostResult implements ChallengeInteractionResult {
    __typename?: 'ReactOnPostResult';
    challenge?: Nullable<Challenge>;
    post?: Nullable<Post>;
}

export class ReactOnCommentResult implements ChallengeInteractionResult {
    __typename?: 'ReactOnCommentResult';
    comment?: Nullable<Comment>;
    challenge?: Nullable<Challenge>;
}

export class FlagCommentResult {
    __typename?: 'FlagCommentResult';
    comment?: Nullable<Comment>;
    parentPost?: Nullable<Post>;
    parentChallenge?: Nullable<Challenge>;
}

export class ReactOnReplyResult implements ChallengeInteractionResult {
    __typename?: 'ReactOnReplyResult';
    reply?: Nullable<Reply>;
    challenge?: Nullable<Challenge>;
}

export class UpdateCommentParticipationResult {
    __typename?: 'UpdateCommentParticipationResult';
    comment?: Nullable<Comment>;
}

export class UpdateCommentParticipationError implements Error {
    __typename?: 'UpdateCommentParticipationError';
    message: string;
}

export class PinCommentResult implements ChallengeInteractionResult {
    __typename?: 'PinCommentResult';
    post?: Nullable<Post>;
    challenge?: Nullable<Challenge>;
}

export class ReportUserResult {
    __typename?: 'ReportUserResult';
    user?: Nullable<User>;
}

export class ReportCommentResult {
    __typename?: 'ReportCommentResult';
    comment?: Nullable<Comment>;
}

export class ReportReplyResult {
    __typename?: 'ReportReplyResult';
    reply?: Nullable<Reply>;
}

export class ReportPostResult {
    __typename?: 'ReportPostResult';
    post?: Nullable<Post>;
}

export class DeletePostResult {
    __typename?: 'DeletePostResult';
    post?: Nullable<Post>;
}

export class DeleteCommentResult {
    __typename?: 'DeleteCommentResult';
    post?: Nullable<Post>;
    challenge?: Nullable<Challenge>;
    isSuccessful?: Nullable<boolean>;
}

export class DeleteReplyResult {
    __typename?: 'DeleteReplyResult';
    isSuccessful?: Nullable<boolean>;
}

export class FollowUserResult {
    __typename?: 'FollowUserResult';
    currentUser?: Nullable<User>;
}

export class UnfollowUserResult {
    __typename?: 'UnfollowUserResult';
    currentUser?: Nullable<User>;
}

export class RemoveFollowerResult {
    __typename?: 'RemoveFollowerResult';
    currentUser?: Nullable<User>;
}

export class CommentEmbargoOnboardingLiftedResult {
    __typename?: 'CommentEmbargoOnboardingLiftedResult';
    lifted: boolean;
}

export class BlockUserResult {
    __typename?: 'BlockUserResult';
    isSuccessful: boolean;
}

export class UnblockUserResult {
    __typename?: 'UnblockUserResult';
    isSuccessful: boolean;
}

export class BlockCommenterOnPostResult {
    __typename?: 'BlockCommenterOnPostResult';
    operation: BlockOperationType;
    commenterId: string;
    postId: string;
}

export class AddCommentResult implements ChallengeInteractionResult {
    __typename?: 'AddCommentResult';
    comment?: Nullable<Comment>;
    post?: Nullable<Post>;
    challenge?: Nullable<Challenge>;
}

export class AddReplyResult implements ChallengeInteractionResult {
    __typename?: 'AddReplyResult';
    reply?: Nullable<Reply>;
    comment?: Nullable<Comment>;
    challenge?: Nullable<Challenge>;
}

export class UpdatedUserResult {
    __typename?: 'UpdatedUserResult';
    updatedUser?: Nullable<User>;
}

export class UpdateFCMTokenStatus {
    __typename?: 'UpdateFCMTokenStatus';
    success: boolean;
}

export class LoginOutput {
    __typename?: 'LoginOutput';
    jwtToken?: Nullable<string>;
    user?: Nullable<User>;
}

export class SignUpOutput {
    __typename?: 'SignUpOutput';
    jwtToken?: Nullable<string>;
    user?: Nullable<User>;
}

export class DeleteFirebaseUserResult {
    __typename?: 'DeleteFirebaseUserResult';
    isSuccessful: boolean;
}

export class OperationSuccessfulResult {
    __typename?: 'OperationSuccessfulResult';
    isSuccessful: boolean;
}

export class UpdateRealIdVerificationResult {
    __typename?: 'UpdateRealIdVerificationResult';
    message: string;
}

export class WildrVerifiedManualReviewResult {
    __typename?: 'WildrVerifiedManualReviewResult';
    message: string;
}

export class RequestDeleteUserResult {
    __typename?: 'RequestDeleteUserResult';
    deleteRequestAccepted: boolean;
}

export class UpdateLastSeenCursorOutput {
    __typename?: 'UpdateLastSeenCursorOutput';
    isSuccessful: boolean;
}

export class UpdateListResult {
    __typename?: 'UpdateListResult';
    listDetails?: Nullable<UserList>;
    owner?: Nullable<User>;
}

export class CreateUserListResult {
    __typename?: 'CreateUserListResult';
    id?: Nullable<string>;
    isSuccessful?: Nullable<string>;
}

export class DeleteUserListResult {
    __typename?: 'DeleteUserListResult';
    isSuccessful?: Nullable<string>;
}

export class UpdateListVisibilityResult {
    __typename?: 'UpdateListVisibilityResult';
    isSuccessful: boolean;
    user?: Nullable<User>;
}

export class CreateChallengeResult {
    __typename?: 'CreateChallengeResult';
    creator?: Nullable<User>;
    challenge: Challenge;
}

export class EditChallengeResult {
    __typename?: 'EditChallengeResult';
    creator?: Nullable<User>;
    challenge: Challenge;
}

export class ChallengeTrollDetectionData {
    __typename?: 'ChallengeTrollDetectionData';
    result?: Nullable<string>;
    message?: Nullable<string>;
}

export class ChallengeTrollDetectionError implements Error {
    __typename?: 'ChallengeTrollDetectionError';
    message: string;
    name?: Nullable<ChallengeTrollDetectionData>;
    description?: Nullable<ChallengeTrollDetectionData>;
}

export class JoinChallengeResult {
    __typename?: 'JoinChallengeResult';
    challenge?: Nullable<Challenge>;
}

export class PinChallengeEntryResult {
    __typename?: 'PinChallengeEntryResult';
    challenge?: Nullable<Challenge>;
    entry?: Nullable<Post>;
}

export class LeaveChallengeResult {
    __typename?: 'LeaveChallengeResult';
    challenge?: Nullable<Challenge>;
}

export class PinCommentOnChallengeResult {
    __typename?: 'PinCommentOnChallengeResult';
    challenge?: Nullable<Challenge>;
    pinnedComment?: Nullable<Comment>;
}

export class UnPinCommentOnChallengeResult {
    __typename?: 'UnPinCommentOnChallengeResult';
    challenge?: Nullable<Challenge>;
}

export class ReportChallengeResult {
    __typename?: 'ReportChallengeResult';
    challenge?: Nullable<Challenge>;
}

export class AddUserToWaitlistResult {
    __typename?: 'AddUserToWaitlistResult';
    success: boolean;
}

export class AddEmailToWaitlistResult {
    __typename?: 'AddEmailToWaitlistResult';
    success: boolean;
}

export class SkipBannerResult {
    __typename?: 'SkipBannerResult';
    success: boolean;
}

export class SendContactUsEmailResult {
    __typename?: 'SendContactUsEmailResult';
    success: boolean;
}

export abstract class IMutation {
    __typename?: 'IMutation';

    abstract followUser(input: FollowUserInput): FollowUserOutput | Promise<FollowUserOutput>;

    abstract unfollowUser(input: UnfollowUserInput): UnfollowUserOutput | Promise<UnfollowUserOutput>;

    abstract removeFollower(input: RemoveFollowerInput): RemoveFollowerOutput | Promise<RemoveFollowerOutput>;

    abstract blockUser(input: BlockUserInput): BlockUserOutput | Promise<BlockUserOutput>;

    abstract unblockUser(input?: Nullable<UnblockUserInput>): UnblockUserOutput | Promise<UnblockUserOutput>;

    abstract repost(input: RepostInput): RepostOutput | Promise<RepostOutput>;

    abstract createMultiMediaPost(input: CreateMultiMediaPostInput): CreatePostOutput | Promise<CreatePostOutput>;

    abstract createTextPost(input: CreateTextPostInput): CreatePostOutput | Promise<CreatePostOutput>;

    abstract createImagePost(input: CreateImagePostInput): CreatePostOutput | Promise<CreatePostOutput>;

    abstract createVideoPost(input: CreateVideoPostInput): CreatePostOutput | Promise<CreatePostOutput>;

    abstract uploadImage(input: UploadImageInput): UploadImageOutput | Promise<UploadImageOutput>;

    abstract uploadVideo(input: UploadVideoInput): UploadVideoOutput | Promise<UploadVideoOutput>;

    abstract reactOnPost(input: ReactOnPostInput): ReactOnPostOutput | Promise<ReactOnPostOutput>;

    abstract reactOnComment(input: ReactOnCommentInput): ReactOnCommentOutput | Promise<ReactOnCommentOutput>;

    abstract reactOnReply(input: ReactOnReplyInput): ReactOnReplyOutput | Promise<ReactOnReplyOutput>;

    abstract updateCommentParticipation(input: UpdateCommentParticipationInput): Nullable<UpdateCommentParticipationOutput> | Promise<Nullable<UpdateCommentParticipationOutput>>;

    abstract pinComment(input: PinCommentInput): Nullable<PinCommentOutput> | Promise<Nullable<PinCommentOutput>>;

    abstract sharePost(input: SharePostInput): SharePostOutput | Promise<SharePostOutput>;

    abstract addComment(input: AddCommentInput): Nullable<AddCommentOutput> | Promise<Nullable<AddCommentOutput>>;

    abstract addReply(input: AddReplyInput): Nullable<AddReplyOutput> | Promise<Nullable<AddReplyOutput>>;

    abstract login(username: string, password: string, fcmToken?: Nullable<string>): LoginOutput | Promise<LoginOutput>;

    abstract signUpWithEmail(input: SignUpWithEmailInput): SignUpOutput | Promise<SignUpOutput>;

    abstract signUpWithPhoneNumber(input: SignUpWithPhoneNumberInput): SignUpOutput | Promise<SignUpOutput>;

    abstract reportPost(input?: Nullable<ReportPostInput>): Nullable<ReportPostOutput> | Promise<Nullable<ReportPostOutput>>;

    abstract reportUser(input?: Nullable<ReportUserInput>): Nullable<ReportUserOutput> | Promise<Nullable<ReportUserOutput>>;

    abstract reportComment(input?: Nullable<ReportCommentInput>): Nullable<ReportCommentOutput> | Promise<Nullable<ReportCommentOutput>>;

    abstract flagComment(input: FlagCommentInput): FlagCommentOutput | Promise<FlagCommentOutput>;

    abstract deleteComment(input?: Nullable<DeleteCommentInput>): Nullable<DeleteCommentOutput> | Promise<Nullable<DeleteCommentOutput>>;

    abstract deletePost(input?: Nullable<DeletePostInput>): Nullable<DeletePostOutput> | Promise<Nullable<DeletePostOutput>>;

    abstract reportReply(input?: Nullable<ReportReplyInput>): Nullable<ReportReplyOutput> | Promise<Nullable<ReportReplyOutput>>;

    abstract deleteReply(input?: Nullable<DeleteReplyInput>): Nullable<DeleteReplyOutput> | Promise<Nullable<DeleteReplyOutput>>;

    abstract firebaseEmailAuthentication(input: FirebaseAuthEmailInput): Nullable<FirebaseAuthOutput> | Promise<Nullable<FirebaseAuthOutput>>;

    abstract firebasePhoneNumberAuthentication(input: FirebaseAuthPhoneNumberInput): Nullable<FirebaseAuthOutput> | Promise<Nullable<FirebaseAuthOutput>>;

    abstract firebaseSignup(input: FirebaseSignupInput): Nullable<FirebaseSignupOutput> | Promise<Nullable<FirebaseSignupOutput>>;

    abstract getOrDeleteFirebaseUser(uid: string): GetOrDeleteFirebaseUserOutput | Promise<GetOrDeleteFirebaseUserOutput>;

    abstract updateEmail(input: UpdateEmailInput): UpdateEmailOutput | Promise<UpdateEmailOutput>;

    abstract updateName(input: UpdateNameInput): UpdateNameOutput | Promise<UpdateNameOutput>;

    abstract updateHandle(input: UpdateHandleInput): UpdateHandleOutput | Promise<UpdateHandleOutput>;

    abstract updatePhoneNumber(input: UpdatePhoneNumberInput): UpdatePhoneNumberOutput | Promise<UpdatePhoneNumberOutput>;

    abstract updateBio(input: UpdateBioInput): UpdateBioOutput | Promise<UpdateBioOutput>;

    abstract updatePronoun(input: UpdatePronounInput): UpdatePronounOutput | Promise<UpdatePronounOutput>;

    abstract updateFCMToken(input: UpdateFCMTokenInput): UpdateFCMTokenOutput | Promise<UpdateFCMTokenOutput>;

    abstract updateAvatar(input: UpdateUserAvatarInput): UpdateUserAvatarOutput | Promise<UpdateUserAvatarOutput>;

    abstract removeAvatar(shouldRemove?: Nullable<boolean>): RemoveUserAvatarOutput | Promise<RemoveUserAvatarOutput>;

    abstract updateCommentEmbargoOnboardingAt(shouldLift?: Nullable<boolean>): CommentEmbargoOnboardingLiftedOutput | Promise<CommentEmbargoOnboardingLiftedOutput>;

    abstract requestDeleteUser(requestDelete?: Nullable<boolean>): RequestDeleteUserOutput | Promise<RequestDeleteUserOutput>;

    abstract updateRealIdStatus(input: UpdateRealIdVerificationInput): UpdateRealIdVerificationOutput | Promise<UpdateRealIdVerificationOutput>;

    abstract wildrVerifiedManualReview(input: WildrVerifiedManualReviewInput): Nullable<WildrVerifiedManualReviewOutput> | Promise<Nullable<WildrVerifiedManualReviewOutput>>;

    abstract updateCategoryInterests(input: UpdateCategoryInterestsInput): UpdateCategoryInterestsOutput | Promise<UpdateCategoryInterestsOutput>;

    abstract updatePostTypeInterests(input: UpdatePostTypeInterestsInput): UpdatePostTypeInterestsOutput | Promise<UpdatePostTypeInterestsOutput>;

    abstract updateLastSeenCursor(input: UpdateLastSeenCursorInput): UpdateLastSeenCursorOutput | Promise<UpdateLastSeenCursorOutput>;

    abstract addMemberToList(input: AddMemberToListInput): UpdateMemberListOutput | Promise<UpdateMemberListOutput>;

    abstract addMemberToInnerCircle(input: AddMemberToInnerCircleInput): UpdateMemberListOutput | Promise<UpdateMemberListOutput>;

    abstract removeMemberFromList(input: RemoveMemberFromListInput): UpdateMemberListOutput | Promise<UpdateMemberListOutput>;

    abstract removeMemberFromInnerCircle(input: RemoveMemberFromInnerCircleInput): UpdateMemberListOutput | Promise<UpdateMemberListOutput>;

    abstract createUserList(input: CreateUserListInput): CreateUserListOutput | Promise<CreateUserListOutput>;

    abstract deleteUserList(input: DeleteUserListInput): DeleteUserListOutput | Promise<DeleteUserListOutput>;

    abstract skipOnboarding(input: UpdateOnboardingInput): OnboardingUpdateOutput | Promise<OnboardingUpdateOutput>;

    abstract finishOnboarding(input: UpdateOnboardingInput): OnboardingUpdateOutput | Promise<OnboardingUpdateOutput>;

    abstract updateListVisibility(input: UpdateListVisibilityInput): UpdateListVisibilityOutput | Promise<UpdateListVisibilityOutput>;

    abstract blockCommenterOnPost(input: BlockCommenterOnPostInput): BlockCommenterOnPostOutput | Promise<BlockCommenterOnPostOutput>;

    abstract createChallenge(input: CreateChallengeInput): CreateChallengeOutput | Promise<CreateChallengeOutput>;

    abstract editChallenge(input: EditChallengeInput): EditChallengeOutput | Promise<EditChallengeOutput>;

    abstract joinChallenge(input: JoinChallengeInput): JoinChallengeOutput | Promise<JoinChallengeOutput>;

    abstract pinChallengeEntry(input: PinChallengeEntryInput): PinChallengeEntryOutput | Promise<PinChallengeEntryOutput>;

    abstract leaveChallenge(input: LeaveChallengeInput): LeaveChallengeOutput | Promise<LeaveChallengeOutput>;

    abstract pinCommentOnChallenge(input: PinCommentOnChallengeInput): PinCommentOnChallengeOutput | Promise<PinCommentOnChallengeOutput>;

    abstract unPinCommentOnChallenge(input: UnPinCommentOnChallengeInput): UnPinCommentOnChallengeOutput | Promise<UnPinCommentOnChallengeOutput>;

    abstract reportChallenge(input: ReportChallengeInput): ReportChallengeOutput | Promise<ReportChallengeOutput>;

    abstract addUserToWaitlist(input?: Nullable<AddUserToWaitlistInput>): AddUserToWaitlistOutput | Promise<AddUserToWaitlistOutput>;

    abstract addEmailToWaitlist(input?: Nullable<AddEmailToWaitlistInput>): AddEmailToWaitlistOutput | Promise<AddEmailToWaitlistOutput>;

    abstract skipBanner(input?: Nullable<SkipBannerInput>): SkipBannerOutput | Promise<SkipBannerOutput>;

    abstract sendContactUsEmail(input?: Nullable<SendContactUsEmailInput>): SendContactUsEmailOutput | Promise<SendContactUsEmailOutput>;

    abstract detectTrolling(input: DetectTrollingInput): Nullable<DetectTrollingOutput> | Promise<Nullable<DetectTrollingOutput>>;
}

export class TrollDetectionData {
    __typename?: 'TrollDetectionData';
    result?: Nullable<string>;
}

export class DetectTrollingResult {
    __typename?: 'DetectTrollingResult';
    isTroll?: Nullable<boolean>;
    trollDetectionData?: Nullable<TrollDetectionData>;
}

export type Upload = any;
export type URL = any;
export type Time = any;
export type DateTime = any;
export type Timestamp = any;
export type GetStrikeReportOutput = SmartError | ReviewReportRequest;
export type UpdateCategoryInterestsOutput = SmartError | UpdateCategoryInterestsResult;
export type UpdatePostTypeInterestsOutput = SmartError | UpdatePostTypeInterestsResult;
export type ContentSegment = Text | Tag | User;
export type PostProperties = TextPostProperties | ImagePostProperties | VideoPostProperties;
export type GetFeedOutput = GetFeedResult | SmartError;
export type GetUserOutput = GetUserResult | SmartError;
export type GetPostOutput = GetPostResult | SmartError;
export type GetCommentOutput = GetCommentResult | SmartError;
export type GetReplyOutput = GetReplyResult | SmartError;
export type GetFollowersListOutput = GetFollowersListResult | SmartError;
export type GetFollowingsListOutput = GetFollowingsListResult | SmartError;
export type GetBlockListOutput = GetBlockListResult | SmartError;
export type SearchNode = User | Tag;
export type SearchOutput = SearchResult | SmartError;
export type ESItem = Tag | User | TextPost | VideoPost | ImagePost | MultiMediaPost;
export type ESOutput = ESResult | SmartError;
export type ActivityObject = TextPost | VideoPost | ImagePost | MultiMediaPost | User | Comment | Reply | Challenge;
export type MiscObject = MultiMediaPost | User | Comment | Reply | ReviewReportRequest | Challenge;
export type CheckEmailOutput = SmartError | CheckEmailResult;
export type CheckHandleOutput = SmartError | CheckHandleResult;
export type Check3rdPartyOutput = SmartError | Check3rdPartyResult;
export type Get3rdPartyDetailsOutput = SmartError | Get3rdPartyDetailsResult;
export type PhoneNumberUserExistsOutput = PhoneNumberAccountExistResult;
export type SendEmailVerificationOutput = SendEmailVerificationResult | SmartError;
export type GetInviteCodeOutput = GetInviteCodeResult | SmartError;
export type CheckAndRedeemInviteCodeOutput = CheckAndRedeemInviteCodeResult | SmartError;
export type GetCategoriesOutput = SmartError | GetCategoriesResult;
export type GetPostTypesOutput = SmartError | GetPostTypesResult;
export type GetCategoriesWithTypesOutput = GetCategoriesWithTypesResult | SmartError;
export type IsEmailVerifiedOutput = SmartError | IsEmailVerifiedResult;
export type WildrAppConfigOutput = WildrAppConfig | SmartError;
export type GetChallengesOutput = GetChallengesResult | SmartError;
export type GetChallengeOutput = GetChallengeResult | SmartError;
export type GetJoinedChallengesOutput = GetJoinedChallengesResult | SmartError;
export type GetMyChallengesOutput = GetMyChallengesResult | SmartError;
export type GetFeatureFlagsOutput = FeatureFlagsResult | SmartError;
export type TransactionType = AwardTransactionType;
export type TransactionSender = WildrBot | User;
export type GetWalletOutput = GetWalletResult | SmartError;
export type WalletNestedRoute = WalletTransactionNestedRoute;
export type PageRoute = WalletPageRoute;
export type GetWebAppFeatureFlagsOutput = GetWebAppFeatureFlagsResult | SmartError;
export type CreatePostOutput = CreatePostResult | SmartError | TrollDetectorError;
export type RepostOutput = RepostResult | SmartError | TrollDetectorError;
export type ReactOnPostOutput = SmartError | ReactOnPostResult;
export type ReactOnCommentOutput = ReactOnCommentResult | SmartError;
export type FlagCommentOutput = FlagCommentResult | SmartError;
export type ReactOnReplyOutput = ReactOnReplyResult | SmartError;
export type UpdateCommentParticipationOutput = UpdateCommentParticipationResult | UpdateCommentParticipationError | SmartError;
export type PinCommentOutput = PinCommentResult | SmartError;
export type ReportUserOutput = ReportUserResult | SmartError;
export type ReportCommentOutput = ReportCommentResult | SmartError;
export type ReportReplyOutput = ReportReplyResult | SmartError;
export type ReportPostOutput = ReportPostResult | SmartError;
export type DeletePostOutput = DeletePostResult | SmartError;
export type DeleteCommentOutput = DeleteCommentResult | SmartError;
export type DeleteReplyOutput = DeleteReplyResult | SmartError;
export type FollowUserOutput = FollowUserResult | SmartError;
export type UnfollowUserOutput = UnfollowUserResult | SmartError;
export type RemoveFollowerOutput = RemoveFollowerResult | SmartError;
export type CommentEmbargoOnboardingLiftedOutput = CommentEmbargoOnboardingLiftedResult | SmartError;
export type BlockUserOutput = BlockUserResult | SmartError;
export type UnblockUserOutput = UnblockUserResult | SmartError;
export type BlockCommenterOnPostOutput = BlockCommenterOnPostResult | SmartError;
export type AddCommentOutput = AddCommentResult | SmartError | TrollDetectorError | PostNotFoundError;
export type AddReplyOutput = AddReplyResult | SmartError | TrollDetectorError;
export type FirebaseAuthOutput = LoginOutput | SmartError | AskForHandleAndNameError;
export type FirebaseSignupOutput = SignUpOutput | SmartError | HandleAlreadyTakenError | AskForHandleAndNameError;
export type UpdateEmailOutput = UpdatedUserResult | SmartError;
export type UpdateNameOutput = UpdatedUserResult | SmartError;
export type UpdateHandleOutput = UpdatedUserResult | SmartError;
export type UpdateFCMTokenOutput = UpdateFCMTokenStatus | SmartError;
export type UpdateBioOutput = UpdatedUserResult | SmartError;
export type UpdatePronounOutput = UpdatedUserResult | SmartError;
export type UpdatePhoneNumberOutput = UpdatedUserResult | SmartError;
export type UpdateUserAvatarOutput = UpdatedUserResult | SmartError;
export type RemoveUserAvatarOutput = UpdatedUserResult | SmartError;
export type UpdateRealIdVerificationOutput = UpdateRealIdVerificationResult | SmartError;
export type WildrVerifiedManualReviewOutput = WildrVerifiedManualReviewResult | SmartError;
export type GetOrDeleteFirebaseUserOutput = DeleteFirebaseUserResult | SignUpOutput;
export type RequestDeleteUserOutput = RequestDeleteUserResult | SmartError;
export type UpdateMemberListOutput = UpdateListResult | SmartError;
export type CreateUserListOutput = CreateUserListResult | SmartError;
export type DeleteUserListOutput = DeleteUserListResult | SmartError;
export type OnboardingUpdateOutput = OnboardingStats | SmartError;
export type UpdateListVisibilityOutput = UpdateListVisibilityResult | SmartError;
export type CreateChallengeOutput = CreateChallengeResult | ChallengeTrollDetectionError | SmartError;
export type EditChallengeOutput = EditChallengeResult | ChallengeTrollDetectionError | SmartError;
export type JoinChallengeOutput = JoinChallengeResult | SmartError;
export type PinChallengeEntryOutput = PinChallengeEntryResult | SmartError;
export type LeaveChallengeOutput = LeaveChallengeResult | SmartError;
export type PinCommentOnChallengeOutput = PinCommentOnChallengeResult | SmartError;
export type UnPinCommentOnChallengeOutput = UnPinCommentOnChallengeResult | SmartError;
export type ReportChallengeOutput = ReportChallengeResult | SmartError;
export type AddUserToWaitlistOutput = AddUserToWaitlistResult | SmartError;
export type AddEmailToWaitlistOutput = AddEmailToWaitlistResult | SmartError;
export type SkipBannerOutput = SkipBannerResult | SmartError;
export type SendContactUsEmailOutput = SendContactUsEmailResult | SmartError;
export type DetectTrollingOutput = DetectTrollingResult | SmartError;
type Nullable<T> = T | null;
