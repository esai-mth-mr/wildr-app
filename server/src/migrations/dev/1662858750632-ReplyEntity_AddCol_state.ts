import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { kTableNameReplyEntity } from '../../../constants';

export class ReplyEntityAddColState1662858750632 implements MigrationInterface {
  stateColumn = new TableColumn({
    name: 'state',
    type: 'int',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(kTableNameReplyEntity, this.stateColumn);
    } catch (e) {
      console.error(
        `Error while adding 'state' column to ${kTableNameReplyEntity} `,
        e
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(kTableNameReplyEntity, this.stateColumn);
  }
}
