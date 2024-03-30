import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class PostEntityAddReactorsFeed1639975856770
  implements MigrationInterface
{
  // eslint-disable-next-line
  public async up(queryRunner: QueryRunner): Promise<void> {}
  /* public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('post_entity', [
      new TableColumn({
        name: 'real_reaction_feed_id',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
      new TableColumn({
        name: 'applaud_reaction_feed_id',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
      new TableColumn({
        name: 'like_reaction_feed_id',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
    ]);
    await queryRunner.createForeignKey(
      'post_entity',
      new TableForeignKey({
        columnNames: ['real_reaction_feed_id'],
        referencedTableName: 'feed_entity',
        referencedColumnNames: ['id'],
        name: 'FK_REAL_REACTION_FEED',
      }),
    );
    await queryRunner.createForeignKey(
      'post_entity',
      new TableForeignKey({
        columnNames: ['applaud_reaction_feed_id'],
        referencedTableName: 'feed_entity',
        referencedColumnNames: ['id'],
        name: 'FK_APPLAUD_REACTION_FEED',
      }),
    );
    await queryRunner.createForeignKey(
      'post_entity',
      new TableForeignKey({
        columnNames: ['like_reaction_feed_id'],
        referencedTableName: 'feed_entity',
        referencedColumnNames: ['id'],
        name: 'FK_LIKE_REACTION_FEED',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'post_entity',
      new TableUnique({
        columnNames: ['real_reaction_feed_id'],
        name: 'REL_REAL_REACTION',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'post_entity',
      new TableUnique({
        columnNames: ['applaud_reaction_feed_id'],
        name: 'REL_APPLAUD_REACTION',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'post_entity',
      new TableUnique({
        columnNames: ['like_reaction_feed_id'],
        name: 'REL_LIKE_REACTION_FEED',
      }),
    );
  } */

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('post_entity', 'real_reaction_feed_id');
    await queryRunner.dropColumn('post_entity', 'applaud_reaction_feed_id');
    await queryRunner.dropColumn('post_entity', 'like_reaction_feed_id');
  }
}
