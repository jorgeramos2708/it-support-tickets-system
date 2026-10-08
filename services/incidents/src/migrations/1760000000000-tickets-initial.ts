import { MigrationInterface, QueryRunner } from "typeorm";

export class TicketsInitial1760000000000 implements MigrationInterface {
  name = "TicketsInitial1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" SERIAL PRIMARY KEY,
        "code" VARCHAR(255) NOT NULL UNIQUE,
        "practice" VARCHAR(255) NOT NULL,
        "subject" VARCHAR(255) NOT NULL,
        "description" VARCHAR(255) NOT NULL,
        "requester" VARCHAR(255) NOT NULL,
        "dept" VARCHAR(255) NOT NULL,
        "priority" VARCHAR(255) NOT NULL,
        "status" VARCHAR(255) NOT NULL,
        "assignee" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "attachments" JSONB
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_TICKETS_PRACTICE_STATUS" ON "tickets" ("practice", "status")`,
    );
    await queryRunner.query(`
      CREATE TABLE "ticket_events" (
        "id" SERIAL PRIMARY KEY,
        "ticket_id" INTEGER NOT NULL,
        "at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "kind" VARCHAR(255) NOT NULL,
        "actor" VARCHAR(255) NOT NULL,
        "detail" TEXT,
        "from" VARCHAR(255),
        "to" VARCHAR(255)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_EVENTS_TICKET" ON "ticket_events" ("ticket_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_EVENTS_TICKET"`);
    await queryRunner.query(`DROP TABLE "ticket_events"`);
    await queryRunner.query(`DROP INDEX "IDX_TICKETS_PRACTICE_STATUS"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
  }
}
