import { EntitySchema } from 'typeorm';
import { CommentEntity } from './comment.entity';

export const CommentSchema = new EntitySchema<CommentEntity>({
  name: 'CommentEntity',
  target: CommentEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      primary: true,
      length: 16,
      unique: true,
    },
    authorId: {
      name: 'author_id',
      type: 'char',
      length: 16,
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
    _stats: {
      name: 'stats',
      type: 'jsonb',
      nullable: true,
    },
    content: {
      name: 'content',
      type: 'jsonb',
      nullable: true,
    },
    replyFeedId: {
      name: 'reply_feed_id',
      type: 'text',
      nullable: true,
    },
    postId: {
      name: 'post_id',
      type: 'varchar',
      length: '16',
      nullable: true,
    },
    challengeId: {
      name: 'challenge_id',
      type: 'char',
      length: '16',
      nullable: true,
    },
    _participationType: {
      name: 'participation_type',
      type: 'integer',
      default: 1, //Open
    },
    willBeDeleted: {
      name: 'will_be_deleted',
      type: 'boolean',
      default: false,
    },
    hasRequestedForRepliesDeletion: {
      name: 'replies_deletion_requested',
      type: 'boolean',
      default: false,
    },
    activityData: {
      name: 'activity_data',
      type: 'jsonb',
      nullable: true,
    },
    flagMeta: {
      name: 'flag_meta',
      type: 'jsonb',
      nullable: true,
    },
    body: {
      name: 'body',
      type: 'varchar',
    },
    negativeConfidenceValue: {
      nullable: true,
      name: 'negative_confidence_value',
      type: 'float',
    },
    state: {
      name: 'state',
      type: 'int',
      nullable: true,
    },
  },
  relations: {
    replyFeed: {
      type: 'many-to-one',
      target: 'FeedEntity',
      joinColumn: {
        name: 'reply_feed_id',
      },
    },
    post: {
      type: 'many-to-one',
      target: 'PostEntity',
      joinColumn: {
        name: 'post_id',
      },
    },
    challenge: {
      type: 'many-to-one',
      target: 'ChallengeEntity',
      joinColumn: {
        name: 'challenge_id',
      },
    },
    author: {
      type: 'many-to-one',
      target: 'UserEntity',
      joinColumn: {
        name: 'author_id',
      },
    },
  },
});
