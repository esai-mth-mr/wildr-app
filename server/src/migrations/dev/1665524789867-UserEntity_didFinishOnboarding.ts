import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserEntityDidFinishOnboarding1665524789867
  implements MigrationInterface
{
  didFinishOnboardingColumn = new TableColumn({
    name: 'did_finish_onboarding',
    type: 'bool',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(
        'user_entity',
        this.didFinishOnboardingColumn
      );
      console.log(
        `user_entity did_finish_onboarding column added successfully`
      );
    } catch (e) {
      console.error(
        'Error while running user_entity adding did_finish_onboarding column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn(
        'user_entity',
        this.didFinishOnboardingColumn
      );
      console.log(
        `user_entity did_finish_onboarding column dropped successfully`
      );
    } catch (e) {
      console.error(
        'Error while running dropping user_entity did_finish_onboarding column migration',
        e
      );
      throw e;
    }
  }
}
