import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';

export class PostCategoryEntityAddColCreatedAt1660834567672
  implements MigrationInterface
{
  kTableName = 'post_category_entity';
  kColumns: TableColumnOptions[] = [
    {
      name: 'created_at',
      type: 'timestamp with time zone',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumns(
        this.kTableName,
        this.kColumns.map(c => new TableColumn(c))
      );
      console.log(`post_category_entity created_at column added successfully`);
    } catch (e) {
      console.error(`Error while creating ${this.kTableName} `, e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumns(
        this.kTableName,
        this.kColumns.map(c => new TableColumn(c))
      );
      console.log(
        `post_category_entity created_at column removed successfully`
      );
    } catch (e) {
      console.error(`Error while creating ${this.kTableName} `, e);
      throw e;
    }
  }
}
