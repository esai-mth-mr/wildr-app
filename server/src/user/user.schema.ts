import { EntitySchema } from 'typeorm';
import { UserEntity } from './user.entity';

export const UserSchema = new EntitySchema<UserEntity>({
  name: 'UserEntity',
  target: UserEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      length: 16,
      unique: true,
      primary: true,
    },
    firebaseUID: {
      name: 'firebase_uid',
      type: 'varchar',
      length: 500,
      unique: true,
    },
    _stats: {
      name: 'stats',
      type: 'jsonb',
      nullable: true,
    },
    handle: {
      name: 'handle',
      type: 'varchar',
      length: 200,
      nullable: true,
      unique: true,
    },
    phoneNumber: {
      name: 'phone_number',
      type: 'varchar',
      length: 40,
      nullable: true,
      unique: true,
    },
    name: {
      name: 'name',
      type: 'varchar',
      length: 200,
      nullable: true,
    },
    email: {
      name: 'email',
      type: 'varchar',
      length: 200,
      nullable: true,
      unique: false,
    },
    password: {
      name: 'password',
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    avatarImage: {
      name: 'profile_pic',
      type: 'varchar',
      length: 1024,
      nullable: true,
    },
    gender: {
      name: 'gender',
      type: 'int',
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp with time zone',
      nullable: true,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamp with time zone',
      nullable: true,
    },
    followerFeedId: {
      name: 'follower_feed_id',
      type: 'text',
      nullable: true,
    },
    followingFeedId: {
      name: 'following_feed_id',
      type: 'text',
      nullable: true,
    },
    likeReactionOnPostFeedId: {
      name: 'like_reaction_on_post_feed_id',
      type: 'text',
      nullable: true,
    },
    realReactionOnPostFeedId: {
      name: 'real_reaction_on_post_feed_id',
      type: 'text',
      nullable: true,
    },
    applaudReactionOnPostFeedId: {
      name: 'applaud_reaction_on_post_feed_id',
      type: 'text',
      nullable: true,
    },
    reportCommentFeedId: {
      name: 'report_comment_feed_id',
      type: 'text',
      nullable: true,
    },
    reportReplyFeedId: {
      name: 'report_reply_feed_id',
      type: 'text',
      nullable: true,
    },
    reportPostFeedId: {
      name: 'report_post_feed_id',
      type: 'text',
      nullable: true,
    },
    activityStreamId: {
      name: 'activity_stream_id',
      type: 'varchar',
      length: 30,
      nullable: true,
    },
    activityData: {
      name: 'activity_data',
      type: 'jsonb',
    },
    fcmToken: {
      name: 'fcm_token',
      type: 'varchar',
      length: '512',
      nullable: true,
    },
    blockListFeedId: {
      name: 'block_list_feed_id',
      type: 'text',
      nullable: true,
    },
    strikeData: {
      name: 'strike_data',
      type: 'jsonb',
      nullable: true,
    },
    scoreDataLastArchivedAt: {
      name: 'score_data_archived_at',
      type: 'timestamp with time zone',
      nullable: true,
    },
    lastSuspendedAt: {
      name: 'last_suspended_at',
      type: 'timestamp without time zone',
      nullable: true,
    },
    suspensionExpirationTS: {
      name: 'suspension_expiration_ts',
      type: 'timestamp without time zone',
      nullable: true,
    },
    currentScoreData: {
      name: 'current_score_data',
      type: 'jsonb',
      nullable: true,
    },
    totalPreviousScoreData: {
      name: 'total_score_data',
      type: 'jsonb',
      nullable: true,
    },
    previousScoreData: {
      name: 'previous_score_data',
      type: 'json',
      nullable: true,
    },
    score: {
      name: 'score',
      type: 'float',
      default: 3.5,
    },
    isSuspended: {
      name: 'is_suspended',
      type: 'boolean',
      default: false,
    },
    commentEnabledAt: {
      name: 'comment_enabled_at',
      type: 'timestamp with time zone',
      nullable: true,
    },
    commentOnboardedAt: {
      name: 'comment_onboarded_at',
      type: 'timestamp with time zone',
      nullable: true,
    },
    deleteRequestedAt: {
      name: 'delete_requested_at',
      type: 'timestamp with time zone',
      nullable: true,
    },
    realIdVerificationStatus: {
      name: 'real_id_verification_status',
      type: 'int',
      nullable: true,
      default: null,
    },
    realIdFaceData: {
      name: 'face_data',
      type: 'jsonb',
      nullable: true,
      default: null,
    },
    realIdFaceUrl: {
      name: 'real_id_face_url',
      type: 'varchar',
      nullable: true,
      default: null,
    },
    realIdFailedVerificationImageData: {
      name: 'real_id_failed_verification_image_data',
      type: 'jsonb',
      nullable: true,
      default: null,
    },
    realIdVerifiedAt: {
      name: 'real_id_verified_at',
      type: 'timestamp with time zone',
      nullable: true,
      default: null,
    },
    realIdFailedStatusMessage: {
      name: 'real_id_failed_status_message',
      type: 'varchar',
      nullable: true,
      default: null,
    },
    inviteCount: {
      name: 'invite_count',
      type: 'int',
      nullable: true,
    },
    redeemedInviteCodeId: {
      name: 'redeemed_invite_code_id',
      type: 'varchar',
      length: 30,
      nullable: true,
    },
    bio: {
      name: 'bio',
      type: 'varchar',
      length: 200,
      nullable: true,
    },
    pronoun: {
      name: 'pronoun',
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    lastSeenCursorPersonalizedFeed: {
      name: 'last_seen_cursor_personalized_feed',
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    lastSeenCursorPersonalizedFollowingFeed: {
      name: 'last_seen_cursor_personalized_following_feed',
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    exploreFeedUpdatedAt: {
      name: 'main_feed_updated_at',
      type: 'timestamp with time zone',
      nullable: true,
      default: null,
    },
    exploreFeedRefreshedAt: {
      name: 'main_feed_refreshed_at',
      type: 'timestamp with time zone',
      nullable: true,
      default: null,
    },
    subFeedUpdatedAt: {
      name: 'sub_feed_updated_at',
      type: 'timestamp with time zone',
      nullable: true,
      default: null,
    },
    hasConsumedExploreFeed: {
      name: 'has_consumed_personalized_feed',
      type: 'boolean',
      nullable: true,
    },
    hasConsumedPersonalizedFollowingsFeed: {
      name: 'has_consumed_personalized_followings_feed',
      type: 'boolean',
      nullable: true,
    },
    followingUsersAllPostsFeedId: {
      name: 'following_users_all_posts_feed_id',
      type: 'text',
      nullable: true,
    },
    followingUsersTextPostsFeedId: {
      name: 'following_users_text_posts_feed_id',
      type: 'text',
      nullable: true,
    },
    followingUsersImagePostsFeedId: {
      name: 'following_users_image_posts_feed_id',
      type: 'text',
      nullable: true,
    },
    followingUsersVideoPostsFeedId: {
      name: 'following_users_video_posts_feed_id',
      type: 'text',
      nullable: true,
    },
    followingUsersMultiMediaPostsFeedId: {
      name: 'following_users_multi_media_posts_feed_id',
      type: 'text',
      nullable: true,
    },
    state: {
      name: 'state',
      type: 'int',
      nullable: true,
    },
    didFinishOnboarding: {
      name: 'did_finish_onboarding',
      type: 'bool',
      nullable: true,
    },
    onboardingStats: {
      name: 'onboarding_stats',
      type: 'jsonb',
      nullable: true,
    },
    visibilityPreferences: {
      name: 'visibility_preferences',
      type: 'jsonb',
      nullable: true,
    },
    birthday: {
      name: 'birthday',
      type: 'date',
      nullable: true,
    },
    challengeContext: {
      name: 'challenge_context',
      type: 'jsonb',
      nullable: true,
    },
    localizationData: {
      name: 'localization_data',
      type: 'jsonb',
      nullable: true,
    },
    feedCursors: {
      name: 'feed_cursors',
      type: 'jsonb',
      nullable: true,
    },
    signupData: {
      name: 'signup_data',
      type: 'jsonb',
      nullable: true,
    },
    bannerData: {
      name: 'banner_data',
      type: 'jsonb',
      nullable: true,
    },
    refererId: {
      name: 'referer_id',
      type: 'char',
      length: 16,
      nullable: true,
    },
    wildrcoinData: {
      name: 'wildrcoin_data',
      type: 'jsonb',
      nullable: true,
    },
  },
  relations: {
    likeReactionOnPostFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'like_reaction_on_post_feed_id' },
    },
    realReactionOnPostFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'real_reaction_on_post_feed_id' },
    },
    applaudReactionOnPostFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'applaud_reaction_on_post_feed_id' },
    },
    followerFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'follower_feed_id' },
    },
    followingFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'following_feed_id' },
    },
    reportCommentFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'report_comment_feed_id' },
    },
    reportReplyFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'report_reply_feed_id' },
    },
    reportPostFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'report_post_feed_id' },
    },
    activityStream: {
      type: 'one-to-one',
      target: 'ActivityStreamEntity',
      joinColumn: { name: 'activity_stream_id' },
    },
    blockListFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'block_list_feed_id' },
    },
  },
});
