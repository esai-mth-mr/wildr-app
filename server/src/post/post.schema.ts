import { EntitySchema } from 'typeorm';
import { PostEntity } from './post.entity';

export const PostSchema = new EntitySchema<PostEntity>({
  name: 'PostEntity',
  target: PostEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      primary: true,
      length: 16,
      unique: true,
    },
    type: {
      name: 'type',
      type: 'int',
    },
    baseType: {
      name: 'base_type',
      type: 'int',
      nullable: true,
    },
    isPrivate: {
      name: 'is_private',
      type: 'bool',
      default: false,
    },
    commentScopeType: {
      name: 'comment_scope_type',
      type: 'int',
      default: 0,
    },
    properties: {
      name: 'post_properties',
      type: 'jsonb',
      nullable: true,
    },
    multiPostProperties: {
      name: 'multi_post_properties',
      type: 'jsonb',
      nullable: true,
    },
    _stats: {
      name: 'stats',
      type: 'jsonb',
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
    expiry: {
      name: 'expiry',
      type: 'timestamp with time zone',
      nullable: true,
    },
    commentFeedId: {
      name: 'comment_feed_id',
      type: 'text',
      nullable: true,
    },
    authorId: {
      name: 'author_id',
      type: 'varchar',
      length: 16,
      nullable: true,
    },
    pinnedCommentId: {
      name: 'pinned_comment_id',
      type: 'varchar',
      length: 16,
      nullable: true,
    },
    captionBodyStr: {
      name: 'bodyStr',
      type: 'varchar',
      nullable: true,
    },
    caption: {
      name: 'caption',
      type: 'jsonb',
      nullable: true,
    },
    activityData: {
      name: 'activity_data',
      type: 'jsonb',
      nullable: true,
    },
    wasBypassed: {
      name: 'was_bypassed',
      type: 'bool',
      default: false,
    },
    captionNegativeConfidenceValue: {
      name: 'caption_negative_confidence_value',
      type: 'float',
      nullable: true,
    },
    realReactionFeedId: {
      name: 'real_reaction_feed_id',
      type: 'text',
      nullable: true,
    },
    applaudReactionFeedId: {
      name: 'applaud_reaction_feed_id',
      type: 'text',
      nullable: true,
    },
    likeReactionFeedId: {
      name: 'like_reaction_feed_id',
      type: 'text',
      nullable: true,
    },
    willBeDeleted: {
      name: 'will_be_deleted',
      type: 'boolean',
      nullable: true,
    },
    deleteStatus: {
      name: 'delete_stats',
      type: 'jsonb',
      nullable: true,
    },
    //Uncomment these after migration
    categoryIds: {
      name: 'post_category_ids',
      type: 'varchar',
      array: true,
      nullable: true,
    },
    state: {
      name: 'state',
      type: 'int',
      nullable: true,
    },
    sensitiveStatus: {
      name: 'sensitive_status',
      type: 'int',
      nullable: true,
    },
    accessControl: {
      name: 'access_control',
      type: 'jsonb',
      nullable: true,
    },
    repostMeta: {
      name: 'repost_meta',
      type: 'jsonb',
      nullable: true,
    },
    parentChallengeId: {
      name: 'parent_challenge_id',
      type: 'char',
      length: 16,
      nullable: true,
    },
  },
  relations: {
    parentChallenge: {
      type: 'many-to-one',
      target: 'ChallengeEntity',
      joinColumn: {
        name: 'parent_challenge_id',
      },
    },
    author: {
      type: 'many-to-one',
      target: 'UserEntity',
      joinColumn: {
        name: 'author_id',
      },
    },
    pinnedComment: {
      type: 'one-to-one',
      target: 'CommentEntity',
      joinColumn: {
        name: 'pinned_comment_id',
      },
    },
    realReactionFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'real_reaction_feed_id' },
    },
    applaudReactionFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'applaud_reaction_feed_id' },
    },
    likeReactionFeed: {
      type: 'one-to-one',
      target: 'FeedEntity',
      joinColumn: { name: 'like_reaction_feed_id' },
    },
    // categories: {
    //   type: 'many-to-one',
    //   target: 'PostCategoryEntity',
    //   joinColumn: {name: 'id', referencedColumnName: 'post_category_ids'},
    //   joinTable: true,
    // }
  },
});
