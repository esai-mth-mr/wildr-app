import { EntitySchema } from 'typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';

export const ChallengeSchema = new EntitySchema<ChallengeEntity>({
  name: 'ChallengeEntity',
  target: ChallengeEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      length: 16,
      primary: true,
      unique: true,
    },
    authorId: {
      name: 'author_id',
      type: 'char',
      length: 16,
    },
    name: {
      name: 'name',
      type: 'varchar',
    },
    description: {
      name: 'description',
      type: 'jsonb',
      nullable: true,
    },
    stats: {
      name: 'stats',
      type: 'jsonb',
    },
    categoryIds: {
      name: 'category_ids',
      type: 'varchar',
      array: true,
      nullable: true,
    },
    cover: {
      name: 'cover',
      type: 'jsonb',
      nullable: true,
    },
    startDate: {
      name: 'start_date',
      type: 'timestamp with time zone',
    },
    endDate: {
      name: 'end_date',
      type: 'timestamp with time zone',
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp with time zone',
      createDate: true,
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamp with time zone',
      updateDate: true,
      nullable: true,
    },
    willBeDeleted: {
      name: 'will_be_deleted',
      type: 'boolean',
      nullable: true,
    },
    state: {
      name: 'state',
      type: 'int',
      nullable: true,
    },
    accessControl: {
      name: 'access_control',
      type: 'jsonb',
      nullable: true,
    },
    activityData: {
      name: 'activity_data',
      type: 'jsonb',
      nullable: true,
    },
    pinnedCommentId: {
      name: 'pinned_comment_id',
      type: 'char',
      length: 16,
      nullable: true,
    },
    trollDetectionData: {
      name: 'troll_detection_data',
      type: 'jsonb',
      nullable: true,
    },
  },
  relations: {
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
  },
});
