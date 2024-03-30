import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { kTableNameCommentEntity } from '../../../constants';

export class CommentEntityAddColState1662858716378
  implements MigrationInterface
{
  stateColumn = new TableColumn({
    name: 'state',
    type: 'int',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(kTableNameCommentEntity, this.stateColumn);
    } catch (e) {
      console.error(
        `Error while adding 'state' column to ${kTableNameCommentEntity} `,
        e
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(kTableNameCommentEntity, this.stateColumn);
  }
}
