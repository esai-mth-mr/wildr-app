import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnReviewReportRequestEntityViolatedGuideline1674681634032
  implements MigrationInterface
{
  col = new TableColumn({
    name: 'violated_guideline',
    type: 'integer',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn('review_report_request_entity', this.col);
      console.log(
        `review_report_request_entity violated_guideline column added successfully`
      );
    } catch (e) {
      console.error(
        'Error while running review_report_request_entity#violated_guideline column migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropColumn('review_report_request_entity', this.col);
      console.log(
        `review_report_request_entity violated_guideline column dropped successfully`
      );
    } catch (e) {
      console.error(
        'Error while running dropping review_report_request_entity#violated_guideline' +
          ' column migration',
        e
      );
      throw e;
    }
  }
}
