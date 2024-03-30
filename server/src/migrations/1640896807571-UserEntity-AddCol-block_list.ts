import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class UserEntityBlockList1640896807571 implements MigrationInterface {
  // eslint-disable-next-line
  public async up(queryRunner: QueryRunner): Promise<void> {}
  /* public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_entity',
      new TableColumn({
        name: 'block_list_feed_id',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'user_entity',
      new TableForeignKey({
        columnNames: ['block_list_feed_id'],
        referencedTableName: 'feed_entity',
        referencedColumnNames: ['id'],
        name: 'FK_BLOCK_LIST_FEED',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'user_entity',
      new TableUnique({
        columnNames: ['block_list_feed_id'],
        name: 'REL_BLOCK_LIST_FEED',
      }),
    );
  } */

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_entity', 'block_list_feed_id');
  }
}
