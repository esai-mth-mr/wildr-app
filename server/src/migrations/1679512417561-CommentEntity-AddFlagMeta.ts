import { MigrationInterface, QueryRunner } from 'typeorm';
import { kTableNameCommentEntity } from '../../constants';
import { TableColumn } from 'typeorm/schema-builder/table/TableColumn';

export class CommentEntityAddFlagMeta1679512417561
  implements MigrationInterface
{
  flagMetaColumn = new TableColumn({
    name: 'flag_meta',
    type: 'jsonb',
    isNullable: true,
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner
      .addColumn(kTableNameCommentEntity, this.flagMetaColumn)
      .catch(e => {
        console.error(
          `Error while adding 'flag_meta' column to ${kTableNameCommentEntity} `,
          e
        );
      });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner
      .dropColumn(kTableNameCommentEntity, this.flagMetaColumn)
      .catch(e => {
        console.error(
          `Error while dropping 'flag_meta' column from ${kTableNameCommentEntity} `,
          e
        );
      });
  }
}
