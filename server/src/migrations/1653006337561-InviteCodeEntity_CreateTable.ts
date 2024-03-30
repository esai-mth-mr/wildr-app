import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumnOptions,
} from 'typeorm';

export class InviteCodeEntityCreateTable1653006337561
  implements MigrationInterface
{
  kTableName = 'invite_code_entity';
  kColumns: TableColumnOptions[] = [
    {
      name: 'id',
      type: 'char',
      length: '16',
      isUnique: true,
      isPrimary: true,
    },
    {
      name: 'code',
      type: 'int4',
      isUnique: true,
    },
    {
      name: 'generated_at',
      type: 'timestamp with time zone',
    },
    {
      name: 'inviter_id',
      type: 'varchar',
      length: '30',
      isNullable: true,
    },
    {
      name: 'redeemed_at',
      type: 'timestamp with time zone',
      isNullable: true,
    },
    {
      name: 'redeemed_by_user_id',
      type: 'varchar',
      length: '30',
      isNullable: true,
    },
  ];
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      queryRunner.createTable(
        new Table({ name: this.kTableName, columns: this.kColumns })
      );
    } catch (e) {
      console.error('Error while creating InviteCodeEntity ', e);
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropTable(this.kTableName);
  }
}
