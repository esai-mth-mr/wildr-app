import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostEntityAddColParentChallengeId1686002791733
  implements MigrationInterface
{
  col = new TableColumn({
    name: 'parent_challenge_id',
    type: 'char',
    length: '16',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('post_entity', this.col);
      console.log(`post_entity#parent_challenge_id column added successfully`);
    } catch (e) {
      console.error(
        'Error while running post_entity#parent_challenge_id column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('post_entity', this.col);
      console.log(
        `post_entity#parent_challenge_id column dropped successfully`
      );
    } catch (e) {
      console.error(
        'Error while running dropping post_entity#parent_challenge_id column migration',
        e
      );
      throw e;
    }
  }
}
