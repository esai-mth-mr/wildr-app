import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserEntityAddColVisibilityPreferences1672692499905
  implements MigrationInterface
{
  visibilityPreferencesCol = new TableColumn({
    name: 'visibility_preferences',
    type: 'jsonb',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('user_entity', this.visibilityPreferencesCol);
      console.log(
        `user_entity visibilityPreferencesCol column added successfully`
      );
    } catch (e) {
      console.error(
        'Error while running user_entity#visibilityPreferencesCol column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn(
        'user_entity',
        this.visibilityPreferencesCol
      );
      console.log(
        `user_entity visibilityPreferencesCol column dropped successfully`
      );
    } catch (e) {
      console.error(
        'Error while running dropping user_entity#visibilityPreferencesCol' +
          ' column migration',
        e
      );
      throw e;
    }
  }
}
