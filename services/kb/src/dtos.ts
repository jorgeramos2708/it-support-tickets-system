import { IsBoolean, IsOptional } from "class-validator";

export class MarkHelpfulDto {
  @IsOptional()
  @IsBoolean()
  helpful?: boolean;
}
