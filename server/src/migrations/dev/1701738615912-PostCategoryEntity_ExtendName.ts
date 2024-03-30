import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostCategoryEntityExtendName1701738615912
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE post_category_entity ALTER COLUMN name TYPE VARCHAR(50);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE post_category_entity ALTER COLUMN name TYPE VARCHAR(20);`
    );
  }
}
