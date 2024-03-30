import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class UserEntityAddColRealId1656451366529 implements MigrationInterface {
  kColumns = [
    {
      name: 'real_id_verification_status',
      type: 'int',
      isNullable: true,
    },
    {
      name: 'face_data',
      type: 'jsonb',
      isNullable: true,
    },
    {
      name: 'real_id_face_url',
      type: 'varchar',
      isNullable: true,
    },
    {
      name: 'real_id_failed_verification_image_data',
      type: 'jsonb',
      isNullable: true,
    },
    {
      name: 'real_id_verified_at',
      type: 'timestamp with time zone',
      isNullable: true,
    },
    {
      name: 'real_id_failed_status_message',
      type: 'varchar',
      isNullable: true,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumns(
        'user_entity',
        this.kColumns.map(item => new TableColumn(item))
      );
      console.log(`user_entity real id columns added successfully`);
      await queryRunner.createIndex(
        'user_entity',
        new TableIndex({
          name: 'IDX_REAL_ID_VERIFICATION_STATUS',
          columnNames: ['real_id_verification_status'],
        })
      );
      console.log(
        `user_entity real_id_verification_status index added successfully`
      );
    } catch (e) {
      console.error(
        'Error while running user_entity real id add columns migration',
        e
      );
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'user_entity',
      'IDX_REAL_ID_VERIFICATION_STATUS'
    );
    await queryRunner.dropColumns(
      'user_entity',
      this.kColumns.map(r => r.name)
    );
  }
}
