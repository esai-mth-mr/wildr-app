import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColPostEntityRepostMeta1677847324411
  implements MigrationInterface
{
  col = new TableColumn({
    name: 'repost_meta',
    type: 'jsonb',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('post_entity', this.col);
      console.log(`post_entity#repost_meta column added successfully`);
    } catch (e) {
      console.error(
        'Error while running post_entity#post_entity column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('post_entity', this.col);
      console.log(`post_entity#post_entity column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping post_entity#post_entity column migration',
        e
      );
      throw e;
    }
  }
}
