import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserEntityAddBirthday1687812462563 implements MigrationInterface {
  col = new TableColumn({
    name: 'birthday',
    type: 'date',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('user_entity', this.col);
      console.log(`user_entity#birthday column added successfully`);
    } catch (e) {
      console.error(
        'Error while running user_entity#birthday column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('user_entity', this.col);
      console.log(`user_entity#birthday column dropped successfully`);
    } catch (e) {
      console.error(
        'Error while running dropping user_entity#birthday column migration',
        e
      );
      throw e;
    }
  }
}
