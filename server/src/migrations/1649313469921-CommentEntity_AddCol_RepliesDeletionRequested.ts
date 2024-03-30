import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CommentEntityAddColRepliesDeletionRequested1649313469921
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'comment_entity',
      new TableColumn({
        name: 'replies_deletion_requested',
        type: 'jsonb',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'comment_entity',
      'replies_deletion_requested'
    );
  }
}
