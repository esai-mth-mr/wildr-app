import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationContentEntityCreate1703235175015
  implements MigrationInterface
{
  name = 'NotificationContentEntityCreate1703235175015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notification_content_entity" ("id" SERIAL NOT NULL, "message_data" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification_content_entity"`);
  }
}
