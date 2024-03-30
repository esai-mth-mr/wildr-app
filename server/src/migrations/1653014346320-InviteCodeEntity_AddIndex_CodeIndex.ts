import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class InviteCodeEntityAddIndexCodeIndex1653014346320
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'invite_code_entity',
      new TableIndex({
        name: 'IDX_CODE',
        columnNames: ['code'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('invite_code_entity', 'IDX_CODE');
  }
}
