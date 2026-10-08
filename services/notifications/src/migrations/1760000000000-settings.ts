import { MigrationInterface, QueryRunner } from "typeorm";

export class Settings1760000000000 implements MigrationInterface {
  name = "Settings1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id" SERIAL PRIMARY KEY,
        "key" VARCHAR(255) NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
  }
}
