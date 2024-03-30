import { UserEntity } from '../user/user.entity';
import { InviteCodeAction } from '@verdzie/server/invite-code/inviteCode.helper';

export class InviteCodeEntity {
  static readonly kInviterUserEntityRelation = 'inviter';
  static readonly kRedeemedByUserEntityRelation = 'redeemedBy';

  id: string;
  code: number;
  generatedAt: Date;
  inviterId?: string;
  inviter?: UserEntity;
  redeemedAt?: Date;
  redeemedByUserId?: string;
  redeemedCount?: number;
  redeemedByUserIds?: string[]; //when users sign up
  utmName?: string;
  action?: InviteCodeAction;

  constructor(partial: Partial<InviteCodeEntity> = {}) {
    Object.assign(this, partial);
  }
}
