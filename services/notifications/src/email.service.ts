import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailNotification {
  routingKey: string;
  code: string | null;
  summary: string;
  audience: string;
}

/** Envía emails para notificaciones críticas vía SMTP (opcional). */
@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private readonly enabled: boolean;
  private readonly from: string;
  private readonly to: string[];

  constructor() {
    this.enabled = Boolean(process.env.SMTP_HOST);
    this.from = process.env.SMTP_FROM ?? "tickitflow@edrs.xyz";
    this.to = (process.env.NOTIFY_EMAIL_TO ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      console.log(
        `[email] SMTP activo: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587} → ${this.to.length} destinatarios`,
      );
    } else {
      console.log("[email] SMTP no configurado — emails desactivados");
    }
  }

  /** Envía un email si el evento es crítico y SMTP está configurado. */
  async notify(event: EmailNotification): Promise<void> {
    if (!this.enabled || !this.transporter || this.to.length === 0) return;

    // Solo eventos críticos o de tickets (no spam)
    const criticalKeys = [
      "ticket.created",
      "problem.created",
      "change.approved",
      "change.rejected",
      "sla.breach",
    ];
    if (!criticalKeys.includes(event.routingKey)) return;

    const subject = `[TickITFlow] ${event.summary}`;
    const body = this.renderEmail(event);

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: this.to.join(", "),
        subject,
        text: body,
        html: this.renderHtml(event),
      });
      console.log(`[email] enviado: "${subject}" → ${this.to.join(", ")}`);
    } catch (err) {
      console.error("[email] fallo al enviar:", (err as Error).message);
    }
  }

  private renderEmail(event: EmailNotification): string {
    return [
      `TickITFlow — Notificación`,
      ``,
      `Evento:  ${event.routingKey}`,
      `Ticket:  ${event.code ?? "—"}`,
      `Resumen: ${event.summary}`,
      `Audiencia: ${event.audience}`,
      ``,
      `Ver detalles en https://tickitflow.edrs.xyz`,
    ].join("\n");
  }

  private renderHtml(event: EmailNotification): string {
    return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; color: #15181e;">
  <div style="border: 1px solid #dcded9; border-radius: 4px; overflow: hidden;">
    <div style="background: #15181e; padding: 14px 20px;">
      <span style="color: #fbfbf9; font-weight: 600; font-size: 15px;">TickITFlow</span>
      <span style="color: #da291c; font-weight: 600; font-size: 15px; margin-left: 6px;">· Notificación</span>
    </div>
    <div style="padding: 20px; background: #fbfbf9;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #3d434d;">${event.summary}</p>
      <table style="font-size: 13px; color: #3d434d; border-spacing: 0 4px;">
        <tr><td style="color: #666d78; padding-right: 12px; white-space: nowrap;">Evento</td><td>${event.routingKey}</td></tr>
        <tr><td style="color: #666d78; padding-right: 12px;">Ticket</td><td style="font-family: monospace;">${event.code ?? "—"}</td></tr>
        <tr><td style="color: #666d78; padding-right: 12px;">Audiencia</td><td>${event.audience}</td></tr>
      </table>
      <a href="https://tickitflow.edrs.xyz" style="display: inline-block; margin-top: 16px; background: #da291c; color: #fbfbf9; padding: 8px 16px; border-radius: 3px; text-decoration: none; font-size: 13px; font-weight: 500;">Ver en la consola</a>
    </div>
  </div>
</body>
</html>`;
  }
}
