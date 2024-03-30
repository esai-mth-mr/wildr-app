import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityAddChallengeContext1690574834274
  implements MigrationInterface
{
  name = 'UserEntityAddChallengeContext1690574834274';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "challenge_context" jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "challenge_context"`
    );
  }
}
