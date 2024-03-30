import { WaitlistEntity } from '@verdzie/server/waitlist/waitlist.entity';
import { EntitySchema } from 'typeorm';

export const WaitlistSchema = new EntitySchema<WaitlistEntity>({
  name: 'WaitlistEntity',
  target: WaitlistEntity,
  columns: {
    email: {
      name: 'email',
      type: 'text',
      nullable: false,
      primary: true,
    },
    waitlistType: {
      name: 'waitlist_type',
      type: 'smallint',
      nullable: false,
      primary: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp',
      createDate: true,
    },
  },
});
