import { EntitySchema } from 'typeorm';
import { FeedEntity } from './feed.entity';

export const FeedSchema = new EntitySchema<FeedEntity>({
  name: 'FeedEntity',
  target: FeedEntity,
  columns: {
    id: {
      name: 'id',
      type: 'varchar',
      primary: true,
      // length: 30,
      unique: true,
    },
    pageNumber: {
      name: 'page_number',
      type: 'int',
    },
    _count: {
      name: 'count',
      type: 'int',
      nullable: true,
    },
    page: {
      name: 'page',
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
  },
});
