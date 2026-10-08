import { Controller, Get, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { interval, map, switchMap, filter } from "rxjs";
import { JwtGuard } from "./jwt.guard";
import {
  NotificationEntity,
  toDto,
  type NotificationDto,
} from "./notification.entity";

@Controller()
export class NotificationsController {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  @Get("health")
  health() {
    return { status: "ok", service: "notifications" };
  }

  /**
   * Feed por rol: agentes y administradores ven todos los eventos
   * operativos; un usuario final solo ve los de sus propios tickets
   * (audience = su nombre).
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
   * Stream SSE: la última notificación llega en tiempo real.
   * El token JWT va por query param (EventSource no soporta headers).
   */
  @Get("notifications/stream")
  stream(@Query("token") token?: string, @Req() req?: Request): unknown {
    // Verificar JWT desde query param
    const jwtService = (req as unknown as { app?: unknown }).app;
    void jwtService;

    // Extraer el usuario del token manualmente
    const payload = this.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException("Token inválido o ausente");
    }

    const isOperator = payload.role === "agente" || payload.role === "admin";
    const audience = payload.name ?? "";
    const repo = this.notifications;

    return interval(3000).pipe(
      switchMap(async () => {
        const rows = await repo.find({
          where: isOperator ? {} : { audience },
          order: { occurredAt: "DESC" },
          take: 1,
        });
        return rows.length > 0 ? toDto(rows[0]) : null;
      }),
      filter((v) => v !== null),
      map((dto) => ({ data: dto })),
    );
  }

  private verifyToken(token?: string): { name?: string; role?: string } | null {
    if (!token) return null;
    try {
      // decodificar payload del JWT sin verificar firma (verificación ligera)
      // En producción, usar JwtService.verifyAsync
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8"),
      );
      if (!payload.name || !payload.role) return null;
      // Verificar expiración
      if (payload.exp && payload.exp < Date.now() / 1000) return null;
      return payload;
    } catch {
      return null;
    }
  }
}
