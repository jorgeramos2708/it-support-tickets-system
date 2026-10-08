import { MigrationInterface, QueryRunner } from "typeorm";

export class CisInitial1760000000000 implements MigrationInterface {
  name = "CisInitial1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cis" (
        "id" SERIAL PRIMARY KEY,
        "code" VARCHAR(255) NOT NULL UNIQUE,
        "name" VARCHAR(255) NOT NULL,
        "type" VARCHAR(255) NOT NULL,
        "environment" VARCHAR(255) NOT NULL,
        "criticality" VARCHAR(255) NOT NULL,
        "owner" VARCHAR(255) NOT NULL,
        "relations" JSONB NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cis"`);
  }
}
