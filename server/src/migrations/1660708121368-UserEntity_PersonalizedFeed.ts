import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { TableColumnOptions } from 'typeorm/schema-builder/options/TableColumnOptions';

export class UserEntityPersonalizedFeed1660708121368
  implements MigrationInterface
{
  kColumns: TableColumnOptions[] = [
    {
      name: 'sub_feed_updated_at',
      type: 'timestamp with time zone',
      isNullable: true,
      default: null,
    },
    {
      name: 'main_feed_refreshed_at',
      type: 'timestamp with time zone',
      isNullable: true,
      default: null,
    },
    {
      name: 'main_feed_updated_at',
      type: 'timestamp with time zone',
      isNullable: true,
      default: null,
    },
    {
      // name: 'last_seen_cursor',
      name: 'last_seen_cursor_personalized_feed',
      type: 'varchar',
      length: '20',
      isNullable: true,
      default: null,
    },
    {
      name: 'last_seen_cursor_personalized_following_feed',
      type: 'varchar',
      length: '20',
      isNullable: true,
      default: null,
    },
    {
      name: 'has_consumed_personalized_feed',
      type: 'boolean',
      isNullable: true,
    },
    {
      name: 'has_consumed_personalized_followings_feed',
      type: 'boolean',
      isNullable: true,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumns(
        'user_entity',
        this.kColumns.map(item => new TableColumn(item))
      );
      console.log(`user_entity columns added successfully`);
    } catch (e) {
      console.error('Error while running user_entity add columns migration', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumns(
        'user_entity',
        this.kColumns.map(item => new TableColumn(item))
      );
      console.log(`user_entity columns added successfully`);
    } catch (e) {
      console.error('Error while running user_entity add columns migration', e);
      throw e;
    }
  }
}
