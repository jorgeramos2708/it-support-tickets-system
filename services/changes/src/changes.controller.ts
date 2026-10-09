import { NotFoundException,
  BadRequestException,
  Body,
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
import {
  ChangeEntity,
  toDto,
  type ChangeApproval,
  type ChangeDto,
  type ChangeStatus,
  type ChangeType,
} from "./change.entity";
import { publishEvent } from "./bus";

/** Las prácticas de consola (problemas, cambios) son de agentes y admins. */
function requireOperator(req: Request): void {
  const role = (req as unknown as { user?: { role?: string } }).user?.role;
  if (role !== "agente" && role !== "admin") {
    throw new ForbiddenException(
      "Los cambios se gestionan desde la consola de agentes",
    );
  }
}

/** Flujo de aprobación ITIL según el tipo de cambio. */
function approvalsFor(type: ChangeType): ChangeApproval[] {
  if (type === "estandar") {
    return [
      { role: "Gestor de cambios", state: "aprobado" },
      { role: "Implementación", state: "aprobado" },
    ];
  }
  if (type === "emergencia") {
    return [
      { role: "ECAB — Dirección de TI", state: "pendiente" },
      { role: "Implementación", state: "pendiente" },
    ];
  }
  return [
    { role: "Gestor de cambios", state: "pendiente" },
    { role: "CAB — Líder de infraestructura", state: "pendiente" },
    { role: "Implementación", state: "pendiente" },
  ];
}

/** Salud del servicio — pública, para monitoreo del stack. */
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "changes" };
  }
}

@Controller()
@UseGuards(JwtGuard)
export class ChangesController {
  constructor(
    @InjectRepository(ChangeEntity)
    private readonly changes: Repository<ChangeEntity>,
  ) {}

  @Get("changes")
  async list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<ChangeDto[]> {
    const take = Math.min(Number(limit ?? 100) || 100, 200);
    const skip = Math.max(Number(offset ?? 0) || 0, 0);
    const rows = await this.changes.find({ order: { createdAt: "DESC" }, take, skip });
    return rows.map(toDto);
  }

  @Get("changes/:code")
  async byCode(@Param("code") code: string): Promise<ChangeDto> {
    const change = await this.changes.findOne({ where: { code } });
    if (!change) throw new Error("Cambio no encontrado");
    return toDto(change);
  }

  @Post("changes")
  async create(
    @Body()
    body: {
      title: string;
      type: ChangeType;
      risk: "bajo" | "medio" | "alto";
      ventana: string;
      description: string;
      solicita: string;
      ciIds?: string[];
      actor?: string;
    },
    @Req() req: Request,
  ): Promise<ChangeDto> {
    requireOperator(req);
    if (!body.title?.trim()) {
      throw new BadRequestException("El título es obligatorio");
    }
    const actor =
      body.actor ??
      (req as unknown as { user?: { name?: string } }).user?.name ??
      "Sistema";
    const all = await this.changes.find();
    let maxNum = 4000;
    for (const c of all) {
      const n = Number(c.code.split("-")[1]);
      if (n > maxNum) maxNum = n;
    }
    const approvals = approvalsFor(body.type);
    const status: ChangeStatus =
      body.type === "estandar" ? "aprobado" : "en_revision";
    const now = new Date();
    const change = await this.changes.save(
      this.changes.create({
        code: `CHG-${maxNum + 1}`,
        title: body.title.trim(),
        type: body.type,
        status,
        risk: body.risk,
        ventana: body.ventana?.trim() || "Por programar",
        description: body.description ?? "",
        solicita: body.solicita ?? actor,
        implementador: null,
        ciIds: body.ciIds ?? [],
        approvals,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const dto = toDto(change);
    await publishEvent("change.created", {
      code: dto.code,
      title: dto.title,
      type: dto.type,
      actor,
      summary: `${dto.code} registrado (${dto.type}) — ${dto.title}`,
    });
    return dto;
  }

  @Patch("changes/:code")
  async patch(
    @Param("code") code: string,
    @Body()
    body: {
      decision?: { role: string; approve: boolean };
      status?: ChangeStatus;
      actor?: string;
    },
    @Req() req: Request,
  ): Promise<ChangeDto> {
    requireOperator(req);
    const change = await this.changes.findOne({ where: { code } });
    if (!change) throw new Error("Cambio no encontrado");
    const actor =
      body.actor ??
      (req as unknown as { user?: { name?: string } }).user?.name ??
      "Sistema";
    let routing = "change.updated";

    if (body.decision) {
      const approvals = change.approvals.map((a) =>
        a.role === body.decision?.role
          ? {
              ...a,
              state: body.decision?.approve
                ? ("aprobado" as const)
                : ("rechazado" as const),
            }
          : a,
      );
      change.approvals = approvals;
      if (change.status === "en_revision" || change.status === "borrador") {
        if (approvals.some((a) => a.state === "rechazado")) {
          change.status = "rechazado";
          routing = "change.rejected";
        } else if (approvals.every((a) => a.state === "aprobado")) {
          change.status = "aprobado";
          routing = "change.approved";
        } else {
          change.status = "en_revision";
        }
      }
    }

    if (body.status && body.status !== change.status) {
      change.status = body.status;
      if (body.status === "aprobado") routing = "change.approved";
      if (body.status === "rechazado") routing = "change.rejected";
    }

    change.updatedAt = new Date();
    await this.changes.save(change);
    const dto = toDto(change);
    await publishEvent(routing, {
      code: dto.code,
      status: dto.status,
      actor,
      summary: `${dto.code} · ${dto.title} — estado ${dto.status}`,
    });
    return dto;
  }
}
