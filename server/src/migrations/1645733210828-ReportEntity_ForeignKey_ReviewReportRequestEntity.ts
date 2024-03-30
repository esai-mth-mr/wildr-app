import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class ReportEntityFK1645733210828 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createForeignKey(
        'report_entity',
        new TableForeignKey({
          name: 'fk_review_report_request',
          columnNames: ['review_request_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'review_report_request_entity',
        })
      );
    } catch (e) {
      console.error('Error while running ReportEntity_Create migration', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'report_entity',
      'fk_review_report_request'
    );
  }
}
