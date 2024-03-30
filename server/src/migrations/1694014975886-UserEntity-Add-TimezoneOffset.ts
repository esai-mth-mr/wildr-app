import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityAddTimezoneOffset1694014975886
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "localization_data" jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "localization_data"`
    );
  }
}
