import { EntitySchema } from 'typeorm';
import { TagEntity } from './tag.entity';

export const TagSchema = new EntitySchema<TagEntity>({
  name: 'TagEntity',
  target: TagEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      length: 16,
      unique: true,
      primary: true,
    },
    name: {
      name: 'handle',
      type: 'varchar',
      length: 200,
      nullable: true,
      unique: true,
    },
  },
});
