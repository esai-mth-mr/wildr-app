import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEntityTypoFix1639975896983 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.renameColumn(
    //   'user_entity',
    //   'applaude_reaction_on_post_feed_id',
    //   'applaud_reaction_on_post_feed_id',
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(
      'user_entity',
      'applaud_reaction_on_post_feed_id',
      'applaude_reaction_on_post_feed_id'
    );
  }
}
