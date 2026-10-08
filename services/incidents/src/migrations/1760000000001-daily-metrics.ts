import { MigrationInterface, QueryRunner } from "typeorm";

export class DailyMetrics1760000000001 implements MigrationInterface {
  name = "DailyMetrics1760000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "daily_metrics" (
        "id" SERIAL PRIMARY KEY,
        "day" DATE NOT NULL,
        "practice" VARCHAR(255) NOT NULL,
        "created" INTEGER NOT NULL,
        "resolved" INTEGER NOT NULL,
        "mttr_minutes" INTEGER NOT NULL,
        "within_sla" INTEGER NOT NULL
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "daily_metrics" ADD CONSTRAINT "UQ_day_practice" UNIQUE ("day", "practice")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_metrics" DROP CONSTRAINT "UQ_day_practice"`,
    );
    await queryRunner.query(`DROP TABLE "daily_metrics"`);
  }
}
