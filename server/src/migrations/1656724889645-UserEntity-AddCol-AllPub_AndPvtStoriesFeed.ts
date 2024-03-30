import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserEntityAddColAllPubAndPvtStoriesFeed1656724889645
  implements MigrationInterface
{
  columns: TableColumn[] = [
    new TableColumn({
      name: 'all_public_stories_feed_id',
      type: 'varchar',
      length: '30',
      isNullable: true,
    }),
    new TableColumn({
      name: 'all_public_and_private_stories_feed_id',
      type: 'varchar',
      length: '30',
      isNullable: true,
    }),
  ];
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user_entity', this.columns);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(
      'user_entity',
      this.columns.map(column => column.name)
    );
  }
}
