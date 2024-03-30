import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostCategoryEntityAddColType1685996735752
  implements MigrationInterface
{
  col = new TableColumn({
    name: 'type',
    type: 'smallint',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('post_category_entity', this.col);
      console.log(`post_category_entity#type column added successfully`);
    } catch (e) {
      console.error(
        'Error while running post_category_entity#type column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('post_category_entity', this.col);
      console.log(`post_category_entity#type column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping post_category_entity#type column migration',
        e
      );
      throw e;
    }
  }
}
