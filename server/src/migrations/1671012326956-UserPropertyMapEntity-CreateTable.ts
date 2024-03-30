import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

export class UserPropertyMapEntityCreateTable1671012326956
  implements MigrationInterface
{
  kTableName = 'user_property_map_entity';
  kColumns: TableColumnOptions[] = [
    {
      name: 'id',
      type: 'varchar',
      isUnique: true,
      isPrimary: true,
    },
    {
      name: 'user_property_map',
      type: 'jsonb',
      isArray: false,
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
