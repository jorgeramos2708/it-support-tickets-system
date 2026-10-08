import {
  Body,
  Controller,
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
import type { Practice, Priority, TicketStatus } from "./ticket.entity";

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
  async list(@Query("practice") practice?: Practice): Promise<TicketDto[]> {
    return this.tickets.list(practice);
  }

  @Get("tickets/:code")
  async byCode(@Param("code") code: string): Promise<TicketDto> {
    return this.tickets.byCode(code);
  }

  @Post("tickets")
  async create(
    @Body()
    body: {
      practice: Practice;
      subject: string;
      description: string;
      requester: string;
      dept: string;
      priority: Priority;
      attachments?: Array<{ name: string; sizeKb: number }>;
    },
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
    @Body()
    body: {
      status?: TicketStatus;
      assignee?: string;
      priority?: Priority;
      note?: string;
      actor?: string;
    },
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
