import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityAlterColToText1688672357718
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN like_reaction_on_post_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN real_reaction_on_post_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN applaud_reaction_on_post_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN follower_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN following_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN report_comment_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN report_reply_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN report_post_feed_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN activity_stream_id TYPE TEXT'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN block_list_feed_id TYPE TEXT'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN like_reaction_on_post_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN real_reaction_on_post_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN applaud_reaction_on_post_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN follower_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN following_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN report_comment_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN report_reply_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN report_post_feed_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN activity_stream_id TYPE VARCHAR'
    );
    await queryRunner.query(
      'ALTER TABLE user_entity ALTER COLUMN block_list_feed_id TYPE VARCHAR'
    );
  }
}
