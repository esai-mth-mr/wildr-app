import { Module } from '@nestjs/common';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';

@Module({
  imports: [TypeOrmModule.forFeature([ChallengeSchema])],
  exports: [ChallengeRepository],
  providers: [ChallengeRepository],
})
export class ChallengeRepositoryModule {}
