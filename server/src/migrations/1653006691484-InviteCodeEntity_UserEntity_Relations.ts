import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class InviteCodeEntityUserEntityRelations1653006691484
  implements MigrationInterface
{
  kInviteCodeTableName = 'invite_code_entity';
  kUserTableName = 'user_entity';
  //InviteCodeTable
  kInviteCodeEntityFkInviterUser = 'fk_inviter_user';
  kInviteCodeEntityFkRedeemedByUser = 'fk_redeemed_by_user';
  //UserEntity
  kUserEntityFkRedeemedInviteCode = 'fk_redeemed_by_user';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.createForeignKey(
        this.kInviteCodeTableName,
        new TableForeignKey({
          name: this.kInviteCodeEntityFkRedeemedByUser,
          columnNames: ['redeemed_by_user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: this.kUserTableName,
        })
      );

      await queryRunner.createForeignKey(
        this.kInviteCodeTableName,
        new TableForeignKey({
          name: this.kInviteCodeEntityFkInviterUser,
          columnNames: ['inviter_id'],
          referencedColumnNames: ['id'],
          referencedTableName: this.kUserTableName,
        })
      );

      await queryRunner.createForeignKey(
        this.kUserTableName,
        new TableForeignKey({
          name: this.kInviteCodeEntityFkRedeemedByUser,
          columnNames: ['redeemed_invite_code_id'],
          referencedColumnNames: ['id'],
          referencedTableName: this.kInviteCodeTableName,
        })
      );
    } catch (error) {
      console.error(
        'Error while creating foreign constraint InviteCode_UserEntity',
        error
      );
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      this.kInviteCodeTableName,
      this.kInviteCodeEntityFkInviterUser
    );
    await queryRunner.dropForeignKey(
      this.kInviteCodeTableName,
      this.kInviteCodeEntityFkRedeemedByUser
    );
    await queryRunner.dropForeignKey(
      this.kUserTableName,
      this.kUserEntityFkRedeemedInviteCode
    );
  }
}
