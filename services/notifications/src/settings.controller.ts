import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtGuard } from "./jwt.guard";
import { SettingEntity } from "./setting.entity";
import {
  SmtpSettings,
  maskSmtpSettings,
  smtpSettingsFromRows,
} from "./setting.entity";
import { EmailService } from "./email.service";

/** Solo admin puede ver/editar la configuración. */
function requireAdmin(req: Request): void {
  const role =
    (req as unknown as { user?: { role?: string } }).user?.role ?? "";
  if (role !== "admin") {
    throw new UnauthorizedException("Solo un administrador puede gestionar la configuración");
  }
}

@Controller("settings")
@UseGuards(JwtGuard)
export class SettingsController {
  constructor(
    @InjectRepository(SettingEntity)
    private readonly settings: Repository<SettingEntity>,
    private readonly emailService: EmailService,
  ) {}

  @Get("smtp")
  async getSmtp(@Req() req: Request) {
    requireAdmin(req);
    const rows = await this.settings.find();
    const smtp = smtpSettingsFromRows(rows);
    return { smtp: maskSmtpSettings(smtp) };
  }

  @Put("smtp")
  async updateSmtp(
    @Body() body: Partial<SmtpSettings>,
    @Req() req: Request,
  ) {
    requireAdmin(req);
    const upserts: Array<{ key: string; value: string }> = [];

    if (body.host !== undefined) upserts.push({ key: "smtp.host", value: body.host });
    if (body.port !== undefined) upserts.push({ key: "smtp.port", value: String(body.port) });
    if (body.user !== undefined) upserts.push({ key: "smtp.user", value: body.user });
    if (body.from !== undefined) upserts.push({ key: "smtp.from", value: body.from });
    if (body.secure !== undefined) upserts.push({ key: "smtp.secure", value: String(body.secure) });
    if (body.enabled !== undefined) upserts.push({ key: "smtp.enabled", value: String(body.enabled) });
    if (body.recipients !== undefined) upserts.push({ key: "notify.emails", value: body.recipients.join(",") });

    // Solo actualizar password si se envía un valor real (no "••••••••")
    if (body.pass !== undefined && body.pass !== "••••••••" && body.pass !== "") {
      upserts.push({ key: "smtp.pass", value: body.pass });
    }

    for (const { key, value } of upserts) {
      await this.settings.upsert({ key, value, updatedAt: new Date() }, ["key"]);
    }

    // Recargar el EmailService con la nueva configuración
    await this.emailService.reload();

    const rows = await this.settings.find();
    return { smtp: maskSmtpSettings(smtpSettingsFromRows(rows)), updated: true };
  }

  @Post("smtp/test")
  async testSmtp(@Req() req: Request) {
    requireAdmin(req);
    const rows = await this.settings.find();
    const smtp = smtpSettingsFromRows(rows);

    if (!smtp.host || smtp.recipients.length === 0) {
      throw new BadRequestException(
        "Configura SMTP_HOST y NOTIFY_EMAIL_TO antes de probar",
      );
    }

    const sent = await this.emailService.sendTest(smtp);
    return { sent, message: sent ? "Email de prueba enviado" : "Fallo al enviar" };
  }
}
