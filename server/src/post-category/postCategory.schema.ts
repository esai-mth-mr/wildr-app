import { EntitySchema } from 'typeorm';
import { PostCategoryEntity } from './postCategory.entity';

export const PostCategorySchema = new EntitySchema<PostCategoryEntity>({
  name: 'PostCategoryEntity',
  target: PostCategoryEntity,
  columns: {
    id: {
      name: 'id',
      type: 'varchar',
      primary: true,
      length: 16,
      unique: true,
    },
    name: {
      name: 'name',
      type: 'varchar',
      length: 20,
      unique: true,
    },
    deprecated: {
      name: 'deprecated',
      type: 'boolean',
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp with time zone',
      nullable: true,
      createDate: true,
    },
    _type: {
      name: 'type',
      type: 'smallint',
      nullable: true,
    },
  },
});
