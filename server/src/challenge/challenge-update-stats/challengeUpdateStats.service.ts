import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { ChallengeStats } from '@verdzie/server/challenge/challenge-data-objects/challenge.stats';
import { Repository } from 'typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';

@Injectable()
export class ChallengeUpdateStatsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly repo: ChallengeRepository
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async jsonbSetStatsInTxT({
    id,
    statsKey,
    statsValue,
    repo,
  }: {
    id: string;
    statsKey: keyof ChallengeStats;
    statsValue: number | string;
    repo?: Repository<ChallengeEntity>;
  }) {
    let statsValueForQuery = `'${statsValue}'`;
    if (typeof statsValue === 'string') {
      statsValueForQuery = `'"${statsValue}"'`;
    }
    await (repo ?? this.repo.repo)
      .createQueryBuilder()
      .update(ChallengeEntity)
      .set({
        stats: () =>
          `jsonb_set(COALESCE(stats, '{}'), '{${statsKey}}', ${statsValueForQuery}::jsonb, true)`,
      })
      .where('id = :id', { id })
      .execute();
  }
}
