import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

export class PostCategoryEntityCreateTable1660713379056
  implements MigrationInterface
{
  kTableName = 'post_category_entity';
  kColumns: TableColumnOptions[] = [
    {
      name: 'id',
      type: 'char',
      length: '16',
      isUnique: true,
      isPrimary: true,
    },
    {
      name: 'name',
      type: 'varchar',
      length: '20',
      isUnique: true,
    },
    {
      name: 'created_at',
      type: 'timestamp with time zone',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      queryRunner.createTable(
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
    queryRunner.dropTable(this.kTableName);
  }
}
