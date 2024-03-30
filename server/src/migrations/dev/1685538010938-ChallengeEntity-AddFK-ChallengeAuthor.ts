import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class ChallengeEntityAddFKChallengeAuthor1685538010938
  implements MigrationInterface
{
  kTableName = 'challenge_entity';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      this.kTableName,
      new TableForeignKey({
        name: 'fk_challenge_author',
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_entity',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(this.kTableName, 'fk_challenge_author');
  }
}
