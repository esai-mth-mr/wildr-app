import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostCategoryAddDeprecated1689626574943
  implements MigrationInterface
{
  kTableName = 'post_category_entity';
  kColumnName = 'deprecated';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.kTableName,
      new TableColumn({
        name: this.kColumnName,
        type: 'boolean',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.kTableName, this.kColumnName);
  }
}
