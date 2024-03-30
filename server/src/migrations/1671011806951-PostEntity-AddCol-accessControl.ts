import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostEntityAddColAccessControl1671011806951
  implements MigrationInterface
{
  accessControlColumn = new TableColumn({
    name: 'access_control',
    type: 'jsonb',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('post_entity', this.accessControlColumn);
      console.log(`post_entity accessControlColumn column added successfully`);
    } catch (e) {
      console.error(
        'Error while running post_entity#accessControlColumn column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('post_entity', this.accessControlColumn);
      console.log(
        `post_entity accessControlColumn column dropped successfully`
      );
    } catch (e) {
      console.error(
        'Error while running dropping post_entity#accessControlColumn' +
          ' column migration',
        e
      );
      throw e;
    }
  }
}
