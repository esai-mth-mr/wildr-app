import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostEntityAlterColToText1688671639320
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN real_reaction_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN applaud_reaction_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN like_reaction_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN comment_feed_id TYPE TEXT'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN real_reaction_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN applaud_reaction_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN like_reaction_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE post_entity ALTER COLUMN comment_feed_id TYPE VARCHAR'
    );
  }
}
