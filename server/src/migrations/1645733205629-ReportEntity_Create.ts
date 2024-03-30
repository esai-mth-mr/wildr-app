import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

export class ReportEntityCreate1645733205629 implements MigrationInterface {
  kColumns: TableColumnOptions[] = [
    {
      name: 'id',
      type: 'char',
      isPrimary: true,
      isUnique: true,
      length: '16',
    },
    {
      name: 'object_author_id',
      type: 'varchar',
      length: '30',
    },
    {
      name: 'object_id',
      type: 'varchar',
      length: '30',
    },
    {
      name: 'object_type',
      type: 'int2',
    },
    {
      name: 'report_type',
      type: 'int2',
    },
    {
      name: 'reporter_comment',
      type: 'varchar',
      isNullable: true,
    },
    {
      name: 'reporter_id',
      type: 'varchar',
      length: '30',
    },
    {
      name: 'review_request_id',
      type: 'varchar',
      length: '30',
      isNullable: true,
    },
    {
      name: 'created_at',
      type: 'timestamp with time zone',
    },
    {
      name: 'updated_at',
      type: 'timestamp without time zone',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createTable(
        new Table({
          name: 'report_entity',
          columns: this.kColumns,
        })
      );
      console.log(`REPORT ENTITY created successfully`);
    } catch (e) {
      console.error('Error while running ReportEntity_Create migration', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('report_entity');
  }
}
