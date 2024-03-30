import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PostEntitySoftDelete1640885941089 implements MigrationInterface {
  name = 'PostEntitySoftDelete1640885941089';

  // eslint-disable-next-line
  public async up(queryRunner: QueryRunner): Promise<void> {}
  /* public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'post_entity',
      new TableColumn({
        name: 'will_be_deleted',
        type: 'boolean',
        isNullable: true,
      }),
    );
  } */

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('post_entity', 'will_be_deleted');
  }
}
