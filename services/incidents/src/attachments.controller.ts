import { BadRequestException, Controller, Get, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { JwtGuard } from "./jwt.guard";
import * as Minio from "minio";

const BUCKET = "tickitflow-attachments";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller("attachments")
@UseGuards(JwtGuard)
export class AttachmentsController {
  private minio: Minio.Client;

  constructor() {
    this.minio = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? "minio",
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: false,
      accessKey: process.env.MINIO_USER ?? "tickit",
      secretKey: process.env.MINIO_PASSWORD ?? "tickit",
    });
  }

  @Post("upload/:ticketCode")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_SIZE } }))
  async upload(
    @Param("ticketCode") ticketCode: string,
    @UploadedFile() file?: Express.Multer.File,
    @Req() req?: Request,
  ) {
    if (!file) throw new BadRequestException("Archivo requerido");
    if (!file.originalname?.trim()) {
      throw new BadRequestException("El archivo debe tener nombre");
    }

    const actor =
      (req as unknown as { user?: { name?: string } }).user?.name ?? "Sistema";
    const objectName = `${ticketCode}/${Date.now()}-${file.originalname}`;

    await this.minio.putObject(BUCKET, objectName, file.buffer, file.size, {
      "Content-Type": file.mimetype ?? "application/octet-stream",
      "X-Uploaded-By": actor,
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
    @Res() res: Response,
  ) {
    try {
      const stream = await this.minio.getObject(
        BUCKET,
        `${ticketCode}/${objectName}`,
      );
      stream.pipe(res);
    } catch {
      res.status(404).json({ message: "Adjunto no encontrado" });
    }
  }
}
