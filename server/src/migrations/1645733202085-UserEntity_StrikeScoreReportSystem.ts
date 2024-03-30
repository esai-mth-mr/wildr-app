import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableColumnOptions,
} from 'typeorm';

export class UserEntityStrikeScoreReportSystem1645733202085
  implements MigrationInterface
{
  kColumns: TableColumnOptions[] = [
    {
      name: 'score_data_archived_at',
      type: 'timestamp with time zone',
      isNullable: true,
    },
    {
      name: 'last_suspended_at',
      type: 'timestamp without time zone',
      isNullable: true,
    },
    {
      name: 'suspension_expiration_ts',
      type: 'timestamp without time zone',
      isNullable: true,
    },
    {
      name: 'current_score_data',
      type: 'jsonb',
      isNullable: true,
    },
    {
      name: 'total_score_data',
      type: 'jsonb',
      isNullable: true,
    },
    {
      name: 'previous_score_data',
      type: 'json',
      isNullable: true,
    },
    {
      name: 'score',
      type: 'float',
      default: 3.5,
    },
    {
      name: 'is_suspended',
      type: 'boolean',
      default: false,
    },
    {
      name: 'delete_requested_at',
      type: 'timestamp with time zone',
      isNullable: true,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of this.kColumns) {
      try {
        await queryRunner.addColumn(
          'user_entity',
          new TableColumn({ ...column })
        );
      } catch (e) {
        console.error('Error while running migration', e);
        throw e;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of this.kColumns) {
      await queryRunner.dropColumn('user_entity', column.name);
    }
  }
}
