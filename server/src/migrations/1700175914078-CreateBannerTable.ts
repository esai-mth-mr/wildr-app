import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

const kBannerColumns: TableColumnOptions[] = [
  {
    name: 'id',
    type: 'text',
    isPrimary: true,
    isUnique: true,
  },
  {
    name: 'data',
    type: 'jsonb',
  },
  {
    name: 'state',
    type: 'smallint',
  },
  {
    name: 'country_code',
    type: 'text',
    isNullable: true,
  },
  {
    name: 'start_date',
    type: 'timestamp with time zone',
    isNullable: true,
  },
  {
    name: 'end_date',
    type: 'timestamp with time zone',
    isNullable: true,
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

export class createBannerTable1700175914078 implements MigrationInterface {
  name = 'CreateBannerTable1700175914078';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'banner_entity',
        columns: kBannerColumns,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('banner_entity');
  }
}
