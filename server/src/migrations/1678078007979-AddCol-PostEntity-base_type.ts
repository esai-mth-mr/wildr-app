import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColPostEntityBaseType1678078007979
  implements MigrationInterface
{
  col = new TableColumn({
    name: 'base_type',
    type: 'int',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('post_entity', this.col);
      console.log(`post_entity#base_type column added successfully`);
    } catch (e) {
      console.error(
        'Error while running post_entity#base_type column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('post_entity', this.col);
      console.log(`post_entity#base_type column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping post_entity#base_type column migration',
        e
      );
      throw e;
    }
  }
}
