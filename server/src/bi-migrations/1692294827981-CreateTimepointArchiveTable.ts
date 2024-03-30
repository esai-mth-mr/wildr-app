import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

const kTimepointArchiveColumns: TableColumnOptions[] = [
  {
    name: 'id',
    type: 'text',
    isPrimary: true,
    isUnique: true,
  },
  {
    name: 'sharding_factor',
    type: 'int',
  },
  {
    name: 'total_notifications',
    type: 'int',
    isNullable: true,
  },
  {
    name: 'notification_tuples',
    type: 'jsonb',
    isNullable: true,
  },
  {
    name: 'process_metadata',
    type: 'jsonb',
  },
  {
    name: 'state',
    type: 'smallint',
  },
  {
    name: 'created_at',
    type: 'timestamp with time zone',
  },
  {
    name: 'updated_at',
    type: 'timestamp with time zone',
  },
];

export class CreateTimepointArchiveTable1692294827981
  implements MigrationInterface
{
  name = 'CreateTimepointArchiveTable1692294827981';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'timepoint_archive_entity',
        columns: kTimepointArchiveColumns,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "timepoint_archive_entity"`);
  }
}
