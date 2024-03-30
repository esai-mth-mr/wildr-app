import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class UserEntityREMOVEUNIQUECONSTRAINTEMAIL1646255327989
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropUniqueConstraint(
        'user_entity',
        'UQ_415c35b9b3b6fe45a3b065030f5'
      );
      await queryRunner.renameColumn(
        'user_entity',
        'firebaseUID',
        'firebase_uid'
      );
    } catch (e) {
      console.error('Error while running ReportEntity_Create migration', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createUniqueConstraint(
      'user_entity',
      new TableUnique({ name: 'unique_email', columnNames: ['email'] })
    );
    await queryRunner.renameColumn(
      'user_entity',
      'firebase_uid',
      'firebaseUID'
    );
  }
}
