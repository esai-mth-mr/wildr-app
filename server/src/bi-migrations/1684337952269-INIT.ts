import { MigrationInterface, QueryRunner } from 'typeorm';

export class INIT1684337952269 implements MigrationInterface {
  name = 'INIT1684337952269';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_entity_index_state" ("id" character varying NOT NULL, "snapshot" jsonb, "incremental_index_state" character varying, "incremental_index_requests" jsonb, "re_index_state" character varying, "re_index_requests" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_92906764a84d47177312395c8b7" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user_entity_index_state" ("id" character varying NOT NULL, "snapshot" jsonb, "incremental_index_state" character varying, "incremental_index_requests" jsonb, "re_index_state" character varying, "re_index_requests" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a2414e82ba94e8fe93438014b56" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "post_entity_index_log" ("id" character varying NOT NULL, "snapshot" jsonb NOT NULL, "index_version" character varying NOT NULL, "index_alias" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3a4915c1548628030e45bdb3277" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user_entity_index_log" ("id" character varying NOT NULL, "snapshot" jsonb NOT NULL, "index_version" character varying NOT NULL, "index_alias" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_25be3ceae39a9d7f502adce5378" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_entity_index_log"`);
    await queryRunner.query(`DROP TABLE "post_entity_index_log"`);
    await queryRunner.query(`DROP TABLE "user_entity_index_state"`);
    await queryRunner.query(`DROP TABLE "post_entity_index_state"`);
  }
}
