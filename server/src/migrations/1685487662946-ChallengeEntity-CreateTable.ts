import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

export const kChallengeColumns: TableColumnOptions[] = [
  {
    name: 'id',
    type: 'char',
    length: '16',
    isUnique: true,
    isPrimary: true,
  },
  {
    name: 'author_id',
    type: 'char',
    length: '16',
  },
  { name: 'name', type: 'varchar' },
  {
    name: 'description',
    type: 'jsonb',
    isNullable: true,
  },
  {
    name: 'stats',
    type: 'jsonb',
  },
  {
    name: 'category_ids',
    type: 'varchar',
    isArray: true,
    isNullable: true,
  },
  {
    name: 'cover',
    type: 'jsonb',
    isNullable: true,
  },
  {
    name: 'will_be_deleted',
    type: 'boolean',
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
  {
    name: 'start_date',
    type: 'timestamp with time zone',
  },
  {
    name: 'end_date',
    type: 'timestamp with time zone',
    isNullable: true,
  },
  {
    name: 'state',
    type: 'smallint',
    isNullable: true,
  },
  {
    name: 'access_control',
    type: 'jsonb',
    isNullable: true,
  },
  {
    name: 'activity_data',
    type: 'jsonb',
    isNullable: true,
  },
  {
    name: 'pinned_comment_id',
    type: 'char',
    length: '16',
    isNullable: true,
  },
  {
    name: 'troll_detection_data',
    type: 'jsonb',
    isNullable: true,
  },
];

export class ChallengeEntityCreateTable1685487662946
  implements MigrationInterface
{
  kTableName = 'challenge_entity';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createTable(
        new Table({ name: this.kTableName, columns: kChallengeColumns })
      );
    } catch (e) {
      console.error('Error while creating ChallengeEntity ', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.kTableName);
  }
}
