import { Inject, Injectable } from '@nestjs/common';
import { UserEntity, UserEntityStats } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class UserStatsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  async jsonSetStatsInTxn({
    id,
    statsKey,
    statsValue,
    userRepo,
  }: {
    id: string;
    statsKey: keyof UserEntityStats;
    statsValue: number;
    userRepo: Repository<UserEntity>;
  }) {
    await userRepo
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        _stats: () =>
          `jsonb_set(COALESCE(stats, '{}'), ` +
          `'{${statsKey}}', ` +
          `'${statsValue}'::jsonb, ` +
          `true)`,
      })
      .where('id = :id', { id })
      .execute();
  }
}
