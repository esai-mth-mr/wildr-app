import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class CommentEntityAddFKChallenge1686854188303
  implements MigrationInterface
{
  kTableName = 'comment_entity';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      this.kTableName,
      new TableForeignKey({
        name: 'fk_challenge',
        columnNames: ['challenge_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'challenge_entity',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(this.kTableName, 'fk_challenge');
  }
}
