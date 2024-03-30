import { EntitySchema } from 'typeorm';
import { ActivityStreamEntity } from './activity.stream.entity';

export const ActivityStreamSchema = new EntitySchema<ActivityStreamEntity>({
  name: 'ActivityStreamEntity',
  target: ActivityStreamEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      primary: true,
      length: 16,
      unique: true,
    },
    activities: {
      name: 'activities',
      type: 'jsonb',
      nullable: true,
    },
  },
});
