import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("notifications")
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "routing_key" })
  routingKey!: string;

  @Column({ type: "varchar", nullable: true })
  code!: string | null;

  @Column()
  summary!: string;

  /** "agente" para eventos operativos; el nombre del solicitante para tickets. */
  @Column({ default: "agente" })
  audience!: string;

  @Column({ type: "timestamptz", name: "occurred_at" })
  occurredAt!: Date;
}

export interface NotificationDto {
  id: number;
  routingKey: string;
  code: string | null;
  summary: string;
  audience: string;
  occurredAt: string;
}

export function toDto(n: NotificationEntity): NotificationDto {
  return {
    id: n.id,
    routingKey: n.routingKey,
    code: n.code,
    summary: n.summary,
    audience: n.audience,
    occurredAt: n.occurredAt.toISOString(),
  };
}
