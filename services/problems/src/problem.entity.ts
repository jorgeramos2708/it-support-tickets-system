import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type ProblemStatus = "nuevo" | "investigacion" | "resuelto" | "cerrado";

@Entity("problems")
export class ProblemEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  status!: ProblemStatus;

  @Column({ name: "cause_raiz", type: "text", nullable: true })
  causeRaiz!: string | null;

  @Column()
  workaround!: boolean;

  @Column({ type: "jsonb", name: "linked_incident_codes" })
  linkedIncidentCodes!: string[];

  @Column({ type: "varchar", nullable: true })
  assignee!: string | null;

  @Column({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}

export interface ProblemDto {
  id: number;
  code: string;
  title: string;
  description: string;
  status: ProblemStatus;
  causeRaiz: string | null;
  workaround: boolean;
  linkedIncidentCodes: string[];
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toDto(p: ProblemEntity): ProblemDto {
  return {
    id: p.id,
    code: p.code,
    title: p.title,
    description: p.description,
    status: p.status,
    causeRaiz: p.causeRaiz,
    workaround: p.workaround,
    linkedIncidentCodes: p.linkedIncidentCodes ?? [],
    assignee: p.assignee,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
