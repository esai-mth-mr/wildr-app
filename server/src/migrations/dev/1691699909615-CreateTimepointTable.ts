import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

const kTimepointColumns: TableColumnOptions[] = [
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

export class CreateTimepointTable1691699909615 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'timepoint_entity',
        columns: kTimepointColumns,
        indices: [
          {
            name: 'idx_timepoint_state',
            columnNames: ['state'],
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "timepoint_entity"`);
  }
}
