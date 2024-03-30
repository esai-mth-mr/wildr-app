import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CommentEntityAddIdxWillBeDeleted1649318046409
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'comment_entity',
      new TableIndex({
        name: 'IDX_COMMENT_WILL_BE_DELETED',
        columnNames: ['will_be_deleted'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'comment_entity',
      'IDX_COMMENT_WILL_BE_DELETED'
    );
  }
}
