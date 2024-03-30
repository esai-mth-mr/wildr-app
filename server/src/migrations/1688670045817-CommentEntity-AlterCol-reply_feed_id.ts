import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentEntityAlterColReplyFeedId1688670045817
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      'ALTER TABLE comment_entity ALTER COLUMN reply_feed_id TYPE TEXT'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      'ALTER TABLE comment_entity ALTER COLUMN reply_feed_id TYPE VARCHAR'
    );
  }
}
