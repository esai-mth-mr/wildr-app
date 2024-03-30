import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostEntityAddColIsPrivate1648689418923
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.addColumn(
    //   'post_entity',
    //   new TableColumn({
    //     name: 'is_private',
    //     type: 'bool',
    //     default: false,
    //   }),
    // );
    // await queryRunner.createIndex(
    //   'post_entity',
    //   new TableIndex({
    //     name: 'IDX_IS_PRIVATE',
    //     columnNames: ['is_private'],
    //   }),
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.dropIndex('post_entity', 'IDX_IS_PRIVATE');
    // await queryRunner.dropColumn('post_entity', 'is_private');
  }
}
