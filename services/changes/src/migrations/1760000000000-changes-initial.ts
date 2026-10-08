import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangesInitial1760000000000 implements MigrationInterface {
  name = "ChangesInitial1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "changes" (
        "id" SERIAL PRIMARY KEY,
        "code" VARCHAR(255) NOT NULL UNIQUE,
        "title" VARCHAR(255) NOT NULL,
        "type" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255) NOT NULL,
        "risk" VARCHAR(255) NOT NULL,
        "ventana" VARCHAR(255) NOT NULL,
        "description" VARCHAR(255) NOT NULL,
        "solicita" VARCHAR(255) NOT NULL,
        "implementador" VARCHAR(255),
        "ci_ids" JSONB NOT NULL,
        "approvals" JSONB NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "changes"`);
  }
}
