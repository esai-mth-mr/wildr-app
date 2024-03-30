import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserListEntityAddCreateUpdateTimestamps1690384304380
  implements MigrationInterface
{
  name = 'UserListEntityAddCreateUpdateTimestamps1690384304380';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_list_entity',
      new TableColumn({
        name: 'created_at',
        type: 'timestamp',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      'user_list_entity',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        isNullable: true,
      })
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
