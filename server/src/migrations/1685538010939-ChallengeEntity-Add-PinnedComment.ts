import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class ChallengeEntityAddPinnedComment1685538010939
  implements MigrationInterface
{
  kTableName = 'challenge_entity';
  kColumnName = 'pinned_comment_id';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      this.kTableName,
      new TableForeignKey({
        name: 'fk_pinned_comment',
        columnNames: [this.kColumnName],
        referencedColumnNames: ['id'],
        referencedTableName: 'comment_entity',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(this.kTableName, 'fk_pinned_comment');
  }
}
