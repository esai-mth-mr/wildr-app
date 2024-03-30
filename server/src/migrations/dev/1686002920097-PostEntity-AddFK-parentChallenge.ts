import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class PostEntityAddFKParentChallenge1686002920097
  implements MigrationInterface
{
  kTableName = 'post_entity';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      this.kTableName,
      new TableForeignKey({
        name: 'fk_parent_challenge',
        columnNames: ['parent_challenge_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'challenge_entity',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(this.kTableName, 'fk_parent_challenge');
  }
}
