import { EntitySchema } from 'typeorm';
import { ReplyEntity } from './reply.entity';

export const ReplySchema = new EntitySchema<ReplyEntity>({
  name: 'ReplyEntity',
  target: ReplyEntity,
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
    willBeDeleted: {
      name: 'will_be_deleted',
      type: 'boolean',
      default: false,
    },
    body: {
      name: 'body',
      type: 'varchar',
    },
    activityData: {
      name: 'activity_data',
      type: 'jsonb',
      nullable: true,
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
    commentId: {
      name: 'comment_id',
      type: 'char',
      length: 16,
    },
  },
  relations: {
    comment: {
      type: 'many-to-one',
      target: 'CommentEntity',
      joinColumn: {
        name: 'comment_id',
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
