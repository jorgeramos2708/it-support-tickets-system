import { Controller, Get, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subject, filter } from "rxjs";
import { JwtService } from "@nestjs/jwt";
import { JwtGuard } from "./jwt.guard";
import {
  NotificationEntity,
  toDto,
  type NotificationDto,
} from "./notification.entity";

/** Bus de notificaciones en memoria: el consumidor de RabbitMQ publica aquí. */
export const notificationSubject = new Subject<NotificationDto>();

@Controller()
export class NotificationsController {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    private readonly jwtService: JwtService,
  ) {}

  @Get("health")
  health() {
    return { status: "ok", service: "notifications" };
  }

  /**
   * Feed por rol: agentes y administradores ven todos los eventos
   * operativos; un usuario final solo ve los de sus propios tickets.
   */
  @Get("notifications")
  @UseGuards(JwtGuard)
  async list(
    @Query("limit") limit?: string,
    @Req() req?: Request,
  ): Promise<NotificationDto[]> {
    const user = (req as unknown as { user?: { name?: string; role?: string } })
      .user;
    const take = Math.min(Number(limit ?? 20) || 20, 50);
    const isOperator = user?.role === "agente" || user?.role === "admin";
    const rows = await this.notifications.find({
      where: isOperator ? {} : { audience: user?.name ?? "" },
      order: { occurredAt: "DESC" },
      take,
    });
    return rows.map(toDto);
  }

  /**
   * Stream SSE: notificaciones en tiempo real vía Subject (push real).
   * El token JWT se verifica con firma (verifyAsync) desde query param.
   */
  @Get("notifications/stream")
  stream(@Query("token") token?: string): unknown {
    if (!token) {
      throw new UnauthorizedException("Token requerido para el stream SSE");
    }

    // Verificar firma del JWT (no solo decodificar)
    let payload: { name?: string; role?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException("Token inválido o expirado");
    }

    const isOperator = payload.role === "agente" || payload.role === "admin";
    const audience = payload.name ?? "";

    // Push real: el Subject emite cada notificación que llega del bus
    return notificationSubject.pipe(
      filter((dto) => {
        // Operadores ven todo; usuarios solo las de su audiencia
        if (isOperator) return true;
        return dto.audience === audience;
      }),
      map((dto) => ({ data: dto })),
    );
  }
}

// Import necesario para el map del stream
import { map } from "rxjs/operators";
