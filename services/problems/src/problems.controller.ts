import { NotFoundException,
  Body,
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtGuard } from "./jwt.guard";
import { ProblemEntity, toDto, type ProblemDto, type ProblemStatus } from "./problem.entity";
import { publishEvent } from "./bus";
import { CreateProblemDto, PatchProblemDto } from "./dtos";

/** Las prácticas de consola (problemas, cambios) son de agentes y admins. */
function requireOperator(req: Request): void {
  const role = (req as unknown as { user?: { role?: string } }).user?.role;
  if (role !== "agente" && role !== "admin") {
    throw new ForbiddenException(
      "Los problemas se gestionan desde la consola de agentes",
    );
  }
}

/** Salud del servicio — pública, para monitoreo del stack. */
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "problems" };
  }
}

@Controller()
@UseGuards(JwtGuard)
export class ProblemsController {
  constructor(
    @InjectRepository(ProblemEntity)
    private readonly problems: Repository<ProblemEntity>,
  ) {}

  @Get("problems")
  async list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<ProblemDto[]> {
    const take = Math.min(Number(limit ?? 100) || 100, 200);
    const skip = Math.max(Number(offset ?? 0) || 0, 0);
    const rows = await this.problems.find({ order: { createdAt: "DESC" }, take, skip });
    return rows.map(toDto);
  }

  @Get("problems/:code")
  async byCode(@Param("code") code: string): Promise<ProblemDto> {
    const problem = await this.problems.findOne({ where: { code } });
    if (!problem) throw new NotFoundException("Problema no encontrado");
    return toDto(problem);
  }

  @Post("problems")
  async create(
    @Body() body: CreateProblemDto,
    @Req() req: Request,
  ): Promise<ProblemDto> {
    requireOperator(req);
    if (!body.title?.trim()) {
      throw new BadRequestException("El título es obligatorio");
    }
    const actor =
      body.actor ??
      (req as unknown as { user?: { name?: string } }).user?.name ??
      "Sistema";
    const all = await this.problems.find();
    let maxNum = 3000;
    for (const p of all) {
      const n = Number(p.code.split("-")[1]);
      if (n > maxNum) maxNum = n;
    }
    const now = new Date();
    const problem = await this.problems.save(
      this.problems.create({
        code: `PRB-${maxNum + 1}`,
        title: body.title.trim(),
        description: body.description ?? "",
        status: "nuevo" as ProblemStatus,
        causeRaiz: null,
        workaround: Boolean(body.workaround),
        linkedIncidentCodes: body.linkedIncidentCodes ?? [],
        assignee: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const dto = toDto(problem);
    await publishEvent("problem.created", {
      code: dto.code,
      title: dto.title,
      actor,
      summary: `${dto.code} registrado — ${dto.title}`,
    });
    return dto;
  }

  @Patch("problems/:code")
  async patch(
    @Param("code") code: string,
    @Body() body: PatchProblemDto,
    @Req() req: Request,
  ): Promise<ProblemDto> {
    requireOperator(req);
    const problem = await this.problems.findOne({ where: { code } });
    if (!problem) throw new NotFoundException("Problema no encontrado");
    const actor =
      body.actor ??
      (req as unknown as { user?: { name?: string } }).user?.name ??
      "Sistema";
    if (body.status && body.status !== problem.status) {
      problem.status = body.status;
    }
    if (typeof body.causeRaiz === "string" && body.causeRaiz.trim()) {
      problem.causeRaiz = body.causeRaiz.trim();
    }
    problem.updatedAt = new Date();
    await this.problems.save(problem);
    const dto = toDto(problem);
    await publishEvent("problem.updated", {
      code: dto.code,
      status: dto.status,
      actor,
      summary: `${dto.code} · ${dto.status === "resuelto" ? "resuelto" : dto.status === "investigacion" ? "en investigación" : "actualizado"}${dto.causeRaiz ? " con causa raíz documentada" : ""}`,
    });
    return dto;
  }
}
