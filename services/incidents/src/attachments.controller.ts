import { BadRequestException, ForbiddenException, Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { JwtGuard } from "./jwt.guard";
import { TicketEntity } from "./ticket.entity";
import * as Minio from "minio";

const BUCKET = "tickitflow-attachments";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf", "text/plain", "text/csv",
  "application/json", "application/zip",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream", "text/x-log", "application/x-msdownload",
];
const ALLOWED_EXT = /\.(png|jpg|jpeg|gif|webp|pdf|txt|csv|json|zip|doc|docx|xls|xlsx|log|ps1|env)$/i;

interface UploadedFilePayload {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[a-z0-9]+$/i);
  return match ? match[0].toLowerCase() : "";
}

@Controller("attachments")
@UseGuards(JwtGuard)
export class AttachmentsController {
  private minio: Minio.Client;

  constructor(
    @InjectRepository(TicketEntity)
    private readonly tickets: Repository<TicketEntity>,
  ) {
    this.minio = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? "minio",
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: false,
      accessKey: process.env.MINIO_USER ?? "tickit",
      secretKey: process.env.MINIO_PASSWORD ?? "tickit",
    });
  }

  /** Verifica que el usuario pueda acceder al ticket (operador o dueño). */
  private async canAccess(ticketCode: string, req: Request): Promise<TicketEntity> {
    const ticket = await this.tickets.findOne({ where: { code: ticketCode } });
    if (!ticket) throw new BadRequestException("Ticket no encontrado");
    const user = (req as unknown as { user?: { name?: string; role?: string } }).user;
    const role = user?.role ?? "";
    if (role === "agente" || role === "admin") return ticket;
    if (role === "usuario" && ticket.requester === user?.name) return ticket;
    throw new ForbiddenException("No tienes acceso a los adjuntos de este ticket");
  }

  @Post("upload/:ticketCode")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_SIZE } }))
  async upload(
    @Param("ticketCode") ticketCode: string,
    @UploadedFile() file?: UploadedFilePayload,
    @Req() req?: Request,
  ) {
    if (!file) throw new BadRequestException("Archivo requerido");

    // Validar ticket y permisos
    await this.canAccess(ticketCode, req!);

    // Validar MIME (whitelist)
    const mime = (file.mimetype ?? "application/octet-stream").toLowerCase();
    if (!ALLOWED_MIME.includes(mime)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${mime}`);
    }

    // Validar extensión (whitelist)
    if (!ALLOWED_EXT.test(file.originalname)) {
      throw new BadRequestException(
        `Extensión no permitida. Formatos válidos: png, jpg, gif, webp, pdf, txt, csv, json, zip, doc, docx, xls, xlsx, log`,
      );
    }

    // Generar UUID como nombre del objeto (evita path traversal)
    const uuid = crypto.randomUUID();
    const safeExt = getExtension(file.originalname);
    const objectName = `${ticketCode}/${uuid}${safeExt}`;

    await this.minio.putObject(BUCKET, objectName, file.buffer, file.size, {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${file.originalname.replace(/"/g, "'")}"`,
      "X-Original-Name": file.originalname.replace(/[^\x20-\x7E]/g, "_"),
    });

    return {
      name: file.originalname,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      objectName,
      uploaded: true,
    };
  }

  @Get("download/:ticketCode/:objectName")
  async download(
    @Param("ticketCode") ticketCode: string,
    @Param("objectName") objectName: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Validar permisos
    await this.canAccess(ticketCode, req);

    // Validar formato del objectName (solo UUID + extensión)
    if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(objectName)) {
      throw new BadRequestException("Nombre de objeto inválido");
    }

    try {
      const stat = await this.minio.statObject(BUCKET, `${ticketCode}/${objectName}`);
      const originalName = stat.metaData["x-amz-meta-x-original-name"] ?? objectName;
      res.setHeader("Content-Type", stat.metaData["content-type"] ?? "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${originalName}"`);
      res.setHeader("Content-Length", stat.size);
      const stream = await this.minio.getObject(BUCKET, `${ticketCode}/${objectName}`);
      stream.pipe(res);
    } catch {
      res.status(404).json({ message: "Adjunto no encontrado" });
    }
  }
}
