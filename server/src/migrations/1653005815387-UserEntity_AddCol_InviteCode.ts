import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserEntityAddColInviteCode1653005815387
  implements MigrationInterface
{
  columns: TableColumn[] = [
    new TableColumn({
      name: 'redeemed_invite_code_id',
      type: 'varchar',
      length: '30',
      isNullable: true,
    }),
    new TableColumn({
      name: 'invite_count',
      type: 'int',
      isNullable: true,
    }),
  ];
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user_entity', this.columns);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(
      'user_entity',
      this.columns.map(column => column.name)
    );
  }
}
