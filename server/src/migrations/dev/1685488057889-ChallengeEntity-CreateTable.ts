import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { kChallengeColumns } from '@verdzie/server/migrations/1685487662946-ChallengeEntity-CreateTable';

export class ChallengeEntityCreateTable1685488057889
  implements MigrationInterface
{
  kTableName = 'challenge_entity';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createTable(
        new Table({ name: this.kTableName, columns: kChallengeColumns })
      );
    } catch (e) {
      console.error('Error while creating ChallengeEntity ', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.kTableName);
  }
}
