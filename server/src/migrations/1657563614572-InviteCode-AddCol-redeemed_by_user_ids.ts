import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class InviteCodeMultiUserRedeemSupport1657563614572
  implements MigrationInterface
{
  columns: TableColumn[] = [
    new TableColumn({
      name: 'redeemed_by_user_ids',
      type: 'varchar',
      isArray: true,
      isNullable: true,
    }),
    new TableColumn({
      name: 'redeem_count',
      type: 'integer',
      isNullable: true,
    }),
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('invite_code_entity', this.columns);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(
      'invite_code_entity',
      this.columns.map(column => column.name)
    );
  }
}
