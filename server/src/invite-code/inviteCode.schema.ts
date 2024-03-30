import { EntitySchema } from 'typeorm';
import { InviteCodeEntity } from './inviteCode.entity';

export const InviteCodeSchema = new EntitySchema<InviteCodeEntity>({
  name: 'InviteCodeEntity',
  target: InviteCodeEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      length: 16,
      unique: true,
      primary: true,
    },
    code: {
      name: 'code',
      type: 'int4', //2,147,483,647
      unique: true,
    },
    generatedAt: {
      name: 'generated_at',
      type: 'timestamp with time zone',
    },
    inviterId: {
      name: 'inviter_id',
      type: 'varchar',
      length: '30',
      nullable: true,
    },
    redeemedAt: {
      name: 'redeemed_at',
      type: 'timestamp with time zone',
      nullable: true,
    },
    redeemedByUserId: {
      name: 'redeemed_by_user_id',
      type: 'varchar',
      length: '30',
      nullable: true,
    },
    redeemedByUserIds: {
      name: 'redeemed_by_user_ids',
      type: 'varchar',
      array: true,
      nullable: true,
    },
    redeemedCount: {
      name: 'redeem_count',
      type: 'integer',
      nullable: true,
    },
    utmName: {
      name: 'utm_name',
      type: 'varchar',
      unique: true,
      nullable: true,
    },
    action: {
      name: 'action',
      type: 'integer',
      nullable: true,
    },
  },
  relations: {
    inviter: {
      type: 'many-to-one',
      target: 'UserEntity',
      joinColumn: { name: 'inviter_id' },
      // joinColumn: true,
    },
    // redeemedByUser: {
    //   type: 'one-to-one',
    //   target: 'UserEntity',
    //   joinColumn: { name: 'redeemed_by_user_id' },
    // },
    // redeemedByUsers: {
    //   type: 'one-to-many',
    //   target: 'UserEntity',
    //   joinColumn: { name: 'redeemed_by_user_ids'},
    // },
  },
});
