import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostEntityPersonalizedFeed1660712908097
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(
        'post_entity',
        new TableColumn({
          name: 'post_category_ids',
          type: 'varchar',
          isArray: true,
          isNullable: true,
        })
      );
      console.log(`post_entity columns added successfully`);
    } catch (e) {
      console.error('Error while running post_entity add columns migration', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('post_entity', 'post_category_ids');
  }
}
