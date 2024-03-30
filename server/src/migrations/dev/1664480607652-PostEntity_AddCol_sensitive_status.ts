import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostEntityAddColSensitiveStatus1664480607652
  implements MigrationInterface
{
  sensitiveStatusColumn = new TableColumn({
    name: 'sensitive_status',
    type: 'int',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('post_entity', this.sensitiveStatusColumn);
      console.log(`post_entity sensitive_status column added successfully`);
    } catch (e) {
      console.error(
        'Error while running post_entity adding sensitive_status column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('post_entity', this.sensitiveStatusColumn);
      console.log(`post_entity sensitive_status column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping post_entity sensitive_status column migration',
        e
      );
      throw e;
    }
  }
}
