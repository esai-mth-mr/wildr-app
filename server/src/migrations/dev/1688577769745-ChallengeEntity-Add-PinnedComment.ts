import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class ChallengeEntityAddPinnedComment1688577769745
  implements MigrationInterface
{
  kTableName = 'challenge_entity';
  kColumnName = 'pinned_comment_id';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.kTableName,
      new TableColumn({
        name: this.kColumnName,
        type: 'char',
        length: '16',
        isNullable: true,
      })
    );

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
    await queryRunner.dropColumn(this.kTableName, this.kColumnName);
  }
}
