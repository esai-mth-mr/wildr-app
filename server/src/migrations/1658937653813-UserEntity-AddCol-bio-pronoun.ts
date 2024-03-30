import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { TableColumnOptions } from 'typeorm/schema-builder/options/TableColumnOptions';

export class UserEntityAddColBioPronoun1658937653813
  implements MigrationInterface
{
  kColumns: TableColumnOptions[] = [
    { name: 'bio', type: 'varchar', length: '200', isNullable: true },
    { name: 'pronoun', type: 'varchar', length: '20', isNullable: true },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumns(
        'user_entity',
        this.kColumns.map(item => new TableColumn(item))
      );
      console.log(`user_entity columns added successfully`);
    } catch (e) {
      console.error('Error while running user_entity add columns migration', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumns(
        'user_entity',
        this.kColumns.map(item => new TableColumn(item))
      );
      console.log(`user_entity columns added successfully`);
    } catch (e) {
      console.error('Error while running user_entity add columns migration', e);
      throw e;
    }
  }
}
