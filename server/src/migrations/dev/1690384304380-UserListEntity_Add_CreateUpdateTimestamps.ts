import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserListEntityAddCreateUpdateTimestamps1690384304380
  implements MigrationInterface
{
  name = 'UserListEntityAddCreateUpdateTimestamps1690384304380';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_list_entity" ADD "created_at" TIMESTAMP DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "user_list_entity" ADD "updated_at" TIMESTAMP DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_list_entity" DROP COLUMN "updated_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_list_entity" DROP COLUMN "created_at"`
    );
  }
}
