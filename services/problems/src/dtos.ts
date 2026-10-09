import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import type { ProblemStatus } from "./problem.entity";

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedIncidentCodes?: string[];

  @IsOptional()
  @IsBoolean()
  workaround?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actor?: string;
}

export class PatchProblemDto {
  @IsOptional()
  @IsIn(["nuevo", "investigacion", "resuelto", "cerrado"], {
    message: "Estado no válido",
  })
  status?: ProblemStatus;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  causeRaiz?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actor?: string;
}
