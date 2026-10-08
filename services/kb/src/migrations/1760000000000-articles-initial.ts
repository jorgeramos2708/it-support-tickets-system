import { MigrationInterface, QueryRunner } from "typeorm";

export class ArticlesInitial1760000000000 implements MigrationInterface {
  name = "ArticlesInitial1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id" SERIAL PRIMARY KEY,
        "code" VARCHAR(255) NOT NULL UNIQUE,
        "title" VARCHAR(255) NOT NULL,
        "practice" VARCHAR(255) NOT NULL,
        "summary" VARCHAR(255) NOT NULL,
        "sections" JSONB NOT NULL,
        "views" INTEGER NOT NULL,
        "helpful" INTEGER NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "articles"`);
  }
}
