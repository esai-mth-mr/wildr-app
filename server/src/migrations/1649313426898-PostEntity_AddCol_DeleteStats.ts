import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostEntityAddColDeleteStats1649313426898
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'post_entity',
      new TableColumn({
        name: 'delete_stats',
        type: 'jsonb',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('post_entity', 'delete_stats');
  }
}
