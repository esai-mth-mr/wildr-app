import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ChallengeEntityAddTrollDetectionData1689196044893
  implements MigrationInterface
{
  kTableName = 'challenge_entity';
  kColumnName = 'troll_detection_data';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.kTableName,
      new TableColumn({
        name: this.kColumnName,
        type: 'jsonb',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.kTableName, this.kColumnName);
  }
}
