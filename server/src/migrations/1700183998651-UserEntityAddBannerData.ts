import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityAddBannerData1700183998651
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "banner_data" jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "banner_data"`
    );
  }
}
