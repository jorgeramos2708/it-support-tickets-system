import { MigrationInterface, QueryRunner } from "typeorm";

export class ProblemsInitial1760000000000 implements MigrationInterface {
  name = "ProblemsInitial1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "problems" (
        "id" SERIAL PRIMARY KEY,
        "code" VARCHAR(255) NOT NULL UNIQUE,
        "title" VARCHAR(255) NOT NULL,
        "description" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255) NOT NULL,
        "cause_raiz" TEXT,
        "workaround" BOOLEAN NOT NULL,
        "linked_incident_codes" JSONB NOT NULL,
        "assignee" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "problems"`);
  }
}
