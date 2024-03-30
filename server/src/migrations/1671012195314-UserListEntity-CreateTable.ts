import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

export class UserListEntityCreateTable1671012195314
  implements MigrationInterface
{
  kTableName = 'user_list_entity';
  kColumns: TableColumnOptions[] = [
    {
      name: 'id',
      type: 'varchar',
      isUnique: true,
      isPrimary: true,
    },
    {
      name: 'name',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'members',
      type: 'jsonb',
      isArray: false,
      isNullable: false,
    },
    {
      name: 'icon_url',
      type: 'varchar',
      isNullable: true,
    },
    {
      name: 'meta_data',
      type: 'jsonb',
      isNullable: true,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createTable(
        new Table({
          name: this.kTableName,
          columns: this.kColumns,
        })
      );
    } catch (e) {
      console.error(`Error while creating ${this.kTableName} `, e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.kTableName);
  }
}
