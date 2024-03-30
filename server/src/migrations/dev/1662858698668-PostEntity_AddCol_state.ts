import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { kTableNamePostEntity } from '../../../constants';

export class PostEntityAddColState1662858698668 implements MigrationInterface {
  stateColumn = new TableColumn({
    name: 'state',
    type: 'int',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(kTableNamePostEntity, this.stateColumn);
    } catch (e) {
      console.error(
        `Error while adding 'state' column to ${kTableNamePostEntity} `,
        e
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(kTableNamePostEntity, this.stateColumn);
  }
}
