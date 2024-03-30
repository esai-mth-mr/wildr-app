import { InviteCodeEntity } from '../inviteCode.entity';

export function InviteCodeEntityFake(
  overrides: Partial<InviteCodeEntity> = {}
): InviteCodeEntity {
  return new InviteCodeEntity({
    id: 'id',
    code: 1234,
    generatedAt: new Date(),
    ...overrides,
  });
}
