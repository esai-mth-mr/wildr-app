import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityAddSignupData1700184099087
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "signup_data" jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "signup_data"`
    );
  }
}
