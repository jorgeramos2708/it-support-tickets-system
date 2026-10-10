import {
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
import { JwtGuard } from "./jwt.guard";
import { TicketsService, type TicketDto } from "./tickets.service";
import type { Practice } from "./ticket.entity";
import { CreateTicketDto, PatchTicketDto } from "./dtos";

/** Salud del servicio — pública, la usa el probe de modo del frontend. */
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "incidents" };
  }
}

@Controller()
@UseGuards(JwtGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get("tickets")
  async list(
    @Query("practice") practice?: Practice,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Req() req?: Request,
  ): Promise<TicketDto[]> {
    const take = Math.min(Number(limit ?? 100) || 100, 200);
    const skip = Math.max(Number(offset ?? 0) || 0, 0);
    const user = (req as unknown as { user?: { name?: string; role?: string } }).user;
    const role = user?.role ?? "agente";
    const requester = role === "usuario" ? (user?.name ?? "") : undefined;
    return this.tickets.list(practice, take, skip, requester);
  }

  @Get("tickets/:code")
  async byCode(
    @Param("code") code: string,
    @Req() req?: Request,
  ): Promise<TicketDto> {
    const tokenUser = (req as unknown as { user?: { name?: string; role?: string } })
      .user;
    const dto = await this.tickets.byCode(code);
    // Coherente con el filtro de requester de la lista: un usuario final
    // solo puede leer sus propios tickets (hallazgo ALTO del audit)
    if (tokenUser?.role === "usuario" && dto.requester !== tokenUser?.name) {
      throw new ForbiddenException("Solo puedes ver tus propios tickets");
    }
    return dto;
  }

  @Post("tickets")
  async create(
    @Body() body: CreateTicketDto,
    @Req() req: Request,
  ): Promise<TicketDto> {
    const tokenUser = (req as unknown as { user?: { name?: string; role?: string } })
      .user;
    const actor = tokenUser?.name ?? "Sistema";
    return this.tickets.create(body, actor, tokenUser?.role ?? "agente");
  }

  @Patch("tickets/:code")
  async patch(
    @Param("code") code: string,
    @Body() body: PatchTicketDto,
    @Req() req: Request,
  ): Promise<TicketDto> {
    const tokenUser = (req as unknown as { user?: { name?: string; role?: string } })
      .user;
    return this.tickets.patch(
      code,
      body,
      tokenUser?.name ?? "Sistema",
      tokenUser?.role ?? "agente",
    );
  }
}
