import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

export class ReviewReportRequestEntityCreate1645733205620
  implements MigrationInterface
{
  kColumns: TableColumnOptions[] = [
    {
      name: 'id',
      type: 'char',
      length: '16',
      isUnique: true,
      isPrimary: true,
    },
    {
      name: 'readable_numeric_id',
      type: 'numeric',
      isUnique: true,
    },
    {
      name: 'reported_object_author_id',
      type: 'varchar',
      length: '30',
    },
    {
      name: 'reported_object_id',
      type: 'varchar',
      length: '16',
    },
    {
      name: 'object_type',
      type: 'int2',
    },
    {
      name: 'reviewer_id',
      type: 'varchar',
      length: '30',
      isNullable: true,
    },
    {
      name: 'reviewer_comment',
      type: 'varchar',
      isNullable: true,
    },
    {
      name: 'review_state',
      type: 'int2',
    },
    {
      name: 'review_result',
      type: 'int2',
    },
    {
      name: 'reports_count',
      type: 'int',
      default: 0,
    },
    {
      name: 'created_at',
      type: 'timestamp with time zone',
    },
    {
      name: 'updated_at',
      type: 'timestamp without time zone',
    },
    {
      name: 'report_ids',
      type: 'text',
      isNullable: false,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createTable(
        new Table({
          name: 'review_report_request_entity',
          columns: this.kColumns,
        })
      );
    } catch (e) {
      console.error(
        'Error while running review_report_request_entity migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_report_request_entity');
  }
}
