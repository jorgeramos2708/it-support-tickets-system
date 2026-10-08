import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type CiType =
  | "servidor"
  | "aplicacion"
  | "estacion"
  | "impresora"
  | "servicio"
  | "red";
export type CiEnvironment = "produccion" | "pruebas" | "desarrollo";
export type CiCriticality = "alta" | "media" | "baja";
export type RelationKind =
  | "se_ejecuta_en"
  | "conecta_a"
  | "depende_de"
  | "parte_de";

export interface CiRelation {
  ciId: string;
  kind: RelationKind;
}

@Entity("cis")
export class CiEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column()
  type!: CiType;

  @Column()
  environment!: CiEnvironment;

  @Column()
  criticality!: CiCriticality;

  @Column()
  owner!: string;

  @Column({ type: "jsonb" })
  relations!: CiRelation[];
}

export interface CiDto {
  id: number;
  code: string;
  name: string;
  type: CiType;
  environment: CiEnvironment;
  criticality: CiCriticality;
  owner: string;
  relations: CiRelation[];
}

export function toDto(ci: CiEntity): CiDto {
  return {
    id: ci.id,
    code: ci.code,
    name: ci.name,
    type: ci.type,
    environment: ci.environment,
    criticality: ci.criticality,
    owner: ci.owner,
    relations: ci.relations ?? [],
  };
}
