import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';
import { kTableNameUserEntity } from '../../../constants';

export class UserEntityAddColConsumedFollowingsFeed1661207149960
  implements MigrationInterface
{
  kColumns: TableColumnOptions[] = [
    {
      name: 'has_consumed_personalized_followings_feed',
      type: 'boolean',
      isNullable: true,
    },
    {
      name: 'last_seen_cursor_personalized_following_feed',
      type: 'varchar',
      length: '20',
      isNullable: true,
      default: null,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    return;
    try {
      await queryRunner.addColumns(
        kTableNameUserEntity,
        this.kColumns.map(c => new TableColumn(c))
      );
      await queryRunner.renameColumn(
        kTableNameUserEntity,
        'has_consumed_all_posts',
        'has_consumed_personalized_feed'
      );
      await queryRunner.renameColumn(
        kTableNameUserEntity,
        'last_seen_cursor',
        'last_seen_cursor_personalized_feed'
      );
      console.log(
        `user_entity has_consumed_personalized_followings_feed column added successfully`
      );
    } catch (e) {
      console.error(`Error while creating ${kTableNameUserEntity} `, e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumns(
        kTableNameUserEntity,
        this.kColumns.map(c => new TableColumn(c))
      );
      await queryRunner.renameColumn(
        kTableNameUserEntity,
        'has_consumed_personalized_feed',
        'has_consumed_all_posts'
      );
      await queryRunner.renameColumn(
        kTableNameUserEntity,
        'last_seen_cursor_personalized_feed',
        'last_seen_cursor'
      );
      console.log(`invite_code_entity utm_name column removed successfully`);
    } catch (e) {
      console.error(`Error while creating ${kTableNameUserEntity} `, e);
      throw e;
    }
  }
}
