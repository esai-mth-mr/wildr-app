import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class UserEntityCommentEmbargo1645144727152
  implements MigrationInterface
{
  // public async up(queryRunner: QueryRunner): Promise<void> {}
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_entity',
      new TableColumn({
        name: 'comment_enabled_at',
        type: 'timestamp with time zone',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      'user_entity',
      new TableColumn({
        name: 'comment_onboarded_at',
        type: 'timestamp with time zone',
        isNullable: true,
      })
    );
    await queryRunner.createIndex(
      'user_entity',
      new TableIndex({
        name: 'IDX_COMMENT_EMBARGO',
        columnNames: ['comment_enabled_at', 'created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('user_entity', 'IDX_COMMENT_EMBARGO');
    await queryRunner.dropColumn('user_entity', 'comment_enabled_at');
    await queryRunner.dropColumn('user_entity', 'comment_onboarded_at');
  }
}
