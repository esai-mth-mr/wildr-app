import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityAddWildrCoinData1700527867344
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "wildrcoin_data" jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "wildrcoin_data"`
    );
  }
}
