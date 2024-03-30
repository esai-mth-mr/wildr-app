import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnUserEntityOnboardingStats1671703160267
  implements MigrationInterface
{
  onboardingStatsCol = new TableColumn({
    name: 'onboarding_stats',
    type: 'jsonb',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('user_entity', this.onboardingStatsCol);
      console.log(`user_entity onboardingStatsCol column added successfully`);
    } catch (e) {
      console.error(
        'Error while running user_entity#onboardingStatsCol column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('user_entity', this.onboardingStatsCol);
      console.log(`user_entity onboardingStatsCol column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping user_entity#onboardingStatsCol' +
          ' column migration',
        e
      );
      throw e;
    }
  }
}
