import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWaitlist1700538109916 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "waitlist_entity" (
        "email" text NOT NULL,
        "waitlist_type" smallint NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_WAITLIST_EMAIL_WAITLIST_TYPE" PRIMARY KEY ("waitlist_type", "email")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "waitlist_entity";`);
  }
}
