import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';

export class AddColumnInviteCodeEntityAction1672275122983
  implements MigrationInterface
{
  kTableName = 'invite_code_entity';
  kColumns: TableColumnOptions[] = [
    {
      name: 'action',
      type: 'integer',
      isNullable: true,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumns(
        this.kTableName,
        this.kColumns.map(c => new TableColumn(c))
      );
      console.log(`invite_code_entity action column added successfully`);
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
      console.log(`invite_code_entity action column removed successfully`);
    } catch (e) {
      console.error(`Error while creating ${this.kTableName} `, e);
      throw e;
    }
  }
}
