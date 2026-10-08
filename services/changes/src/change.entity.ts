import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type ChangeType = "normal" | "estandar" | "emergencia";
export type ChangeStatus =
  | "borrador"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "implementado"
  | "cerrado";
export type ChangeRisk = "bajo" | "medio" | "alto";
export type ApprovalState = "pendiente" | "aprobado" | "rechazado";

export interface ChangeApproval {
  role: string;
  state: ApprovalState;
}

@Entity("changes")
export class ChangeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column()
  title!: string;

  @Column()
  type!: ChangeType;

  @Column()
  status!: ChangeStatus;

  @Column()
  risk!: ChangeRisk;

  @Column()
  ventana!: string;

  @Column()
  description!: string;

  @Column()
  solicita!: string;

  @Column({ type: "varchar", nullable: true })
  implementador!: string | null;

  @Column({ type: "jsonb", name: "ci_ids" })
  ciIds!: string[];

  @Column({ type: "jsonb" })
  approvals!: ChangeApproval[];

  @Column({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}

export interface ChangeDto {
  id: number;
  code: string;
  title: string;
  type: ChangeType;
  status: ChangeStatus;
  risk: ChangeRisk;
  ventana: string;
  description: string;
  solicita: string;
  implementador: string | null;
  ciIds: string[];
  approvals: ChangeApproval[];
  createdAt: string;
  updatedAt: string;
}

export function toDto(c: ChangeEntity): ChangeDto {
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    type: c.type,
    status: c.status,
    risk: c.risk,
    ventana: c.ventana,
    description: c.description,
    solicita: c.solicita,
    implementador: c.implementador,
    ciIds: c.ciIds ?? [],
    approvals: c.approvals ?? [],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
