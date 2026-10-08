import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
}
