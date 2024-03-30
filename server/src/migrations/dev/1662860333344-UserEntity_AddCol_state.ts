import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { kTableNameUserEntity } from '../../../constants';

export class UserEntityAddColState1662860333344 implements MigrationInterface {
  stateColumn = new TableColumn({
    name: 'state',
    type: 'int',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(kTableNameUserEntity, this.stateColumn);
    } catch (e) {
      console.error(
        `Error while adding 'state' column to ${kTableNameUserEntity} `,
        e
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(kTableNameUserEntity, this.stateColumn);
  }
}
