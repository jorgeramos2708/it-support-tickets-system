import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtGuard } from "./jwt.guard";
import { CiEntity, toDto, type CiDto } from "./ci.entity";

/** Salud del servicio — pública, para monitoreo del stack. */
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "cmdb" };
  }
}

@Controller()
@UseGuards(JwtGuard)
export class CmdbController {
  constructor(
    @InjectRepository(CiEntity)
    private readonly cis: Repository<CiEntity>,
  ) {}

  @Get("cis")
  async list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<CiDto[]> {
    const take = Math.min(Number(limit ?? 200) || 200, 500);
    const skip = Math.max(Number(offset ?? 0) || 0, 0);
    const rows = await this.cis.find({ order: { id: "ASC" }, take, skip });
    return rows.map(toDto);
  }

  @Get("cis/:code")
  async byCode(@Param("code") code: string): Promise<CiDto> {
    const ci = await this.cis.findOne({ where: { code } });
    if (!ci) throw new Error("CI no encontrado");
    return toDto(ci);
  }
}
