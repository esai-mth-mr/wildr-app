import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ChallengeEntityAddActivityData1687478327618
  implements MigrationInterface
{
  col = new TableColumn({
    name: 'activity_data',
    type: 'jsonb',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('challenge_entity', this.col);
      console.log(`challenge_entity#activity_data column added successfully`);
    } catch (e) {
      console.error(
        'Error while running challenge_entity#activity_data column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('challenge_entity', this.col);
      console.log(`challenge_entity#activity_data column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping challenge_entity#activity_data column migration',
        e
      );
      throw e;
    }
  }
}
