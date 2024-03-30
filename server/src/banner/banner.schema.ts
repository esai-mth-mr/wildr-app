import { BannerEntity } from '@verdzie/server/banner/banner.entity';
import { EntitySchema } from 'typeorm';

export const BannerSchema = new EntitySchema<BannerEntity>({
  name: 'BannerEntity',
  target: BannerEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      length: 16,
      unique: true,
      primary: true,
    },
    data: {
      name: 'data',
      type: 'jsonb',
    },
    state: {
      name: 'state',
      type: 'smallint',
    },
    countryCode: {
      name: 'country_code',
      type: 'smallint',
      nullable: true,
    },
    startDate: {
      name: 'start_date',
      type: 'timestamp with time zone',
      nullable: true,
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
    },
  },
});
