import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityAddRefererId1700184179700 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" ADD "referer_id" CHAR(16)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_entity" DROP COLUMN "referer_id"`
    );
  }
}
