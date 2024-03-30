import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserEntityAddColAllPubAndPvtPostsFeedId1656722350169
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_entity',
      new TableColumn({
        name: 'all_public_and_private_posts_feed_id',
        type: 'varchar',
        length: '30',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'user_entity',
      'all_public_and_private_posts_feed_id'
    );
  }
}
