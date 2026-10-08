import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationsInitial1760000000000 implements MigrationInterface {
  name = "NotificationsInitial1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL PRIMARY KEY,
        "routing_key" VARCHAR(255) NOT NULL,
        "code" VARCHAR(255),
        "summary" VARCHAR(500) NOT NULL,
        "audience" VARCHAR(255) NOT NULL DEFAULT 'agente',
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
