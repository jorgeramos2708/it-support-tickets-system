import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import type { ChangeRisk, ChangeStatus, ChangeType } from "./change.entity";

export class DecisionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  role!: string;

  @IsBoolean()
  approve!: boolean;
}

export class CreateChangeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsIn(["normal", "estandar", "emergencia"], {
    message: "Tipo de cambio no válido",
  })
  type!: ChangeType;

  @IsIn(["bajo", "medio", "alto"], { message: "Riesgo no válido" })
  risk!: ChangeRisk;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ventana?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  solicita?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ciIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actor?: string;
}

export class PatchChangeDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DecisionDto)
  decision?: DecisionDto;

  @IsOptional()
  @IsIn(
    ["borrador", "en_revision", "aprobado", "rechazado", "implementado", "cerrado"],
    { message: "Estado no válido" },
  )
  status?: ChangeStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actor?: string;
}
