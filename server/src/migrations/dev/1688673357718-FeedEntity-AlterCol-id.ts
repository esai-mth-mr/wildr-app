import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';

export class FeedEntityAlterColId1688673357718 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query('ALTER TABLE feed_entity ALTER COLUMN id TYPE TEXT');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      'ALTER TABLE feed_entity ALTER COLUMN id TYPE VARCHAR(30)'
    );
  }
}
