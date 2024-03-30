import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';

export class InviteCodeEntityAddColName1660834590338
  implements MigrationInterface
{
  kTableName = 'invite_code_entity';
  kColumns: TableColumnOptions[] = [
    {
      name: 'utm_name',
      type: 'varchar',
      isNullable: true,
      isUnique: true,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumns(
        this.kTableName,
        this.kColumns.map(c => new TableColumn(c))
      );
      console.log(`invite_code_entity utm_name column added successfully`);
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
      console.log(`invite_code_entity utm_name column removed successfully`);
    } catch (e) {
      console.error(`Error while creating ${this.kTableName} `, e);
      throw e;
    }
  }
}
