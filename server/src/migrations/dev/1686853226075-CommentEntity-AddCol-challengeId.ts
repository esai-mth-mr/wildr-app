import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CommentEntityAddColChallengeId1686853226075
  implements MigrationInterface
{
  col = new TableColumn({
    name: 'challenge_id',
    type: 'char',
    length: '16',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('comment_entity', this.col);
      console.log(`comment_entity#challenge_id column added successfully`);
    } catch (e) {
      console.error(
        'Error while running comment_entity#challenge_id column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('comment_entity', this.col);
      console.log(`comment_entity#challenge_id column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping comment_entity#challenge_id column migration',
        e
      );
      throw e;
    }
  }
}
