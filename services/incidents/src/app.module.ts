import { getJwtSecret } from "./jwt-secret";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Injectable, Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { Repository } from "typeorm";
import {
  TicketEntity,
  TicketEventEntity,
  type Practice,
  type Priority,
  type TicketStatus,
} from "./ticket.entity";
import { DailyMetricEntity } from "./daily-metric.entity";
import { TicketsController, HealthController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import { AttachmentsController } from "./attachments.controller";
import { PromMetricsController, HttpMetricsInterceptor } from "./prom.metrics.controller";
import { JwtGuard } from "./jwt.guard";
import { startAuditConsumer } from "./bus";

const SEED: Array<{
  practice: Practice;
  subject: string;
  description: string;
  requester: string;
  dept: string;
  priority: Priority;
  status: TicketStatus;
  hoursAgo: number;
}> = [
  {
    practice: "incidente",
    subject: "VPN no conecta desde casa",
    description: "El cliente se queda en «verificando» desde la noche de ayer.",
    requester: "M. Aguilar",
    dept: "Finanzas",
    priority: "P2",
    status: "nuevo",
    hoursAgo: 2,
  },
  {
    practice: "incidente",
    subject: "Impresora de piso 2 atascada",
    description: "La impresora del pasillo muestra «atasco en fusora».",
    requester: "D. Espinoza",
    dept: "Ventas",
    priority: "P3",
    status: "en_progreso",
    hoursAgo: 6,
  },
  {
    practice: "incidente",
    subject: "Certificado SSL vencido en el portal",
    description: "El portal de proveedores muestra advertencia de seguridad.",
    requester: "S. Montes",
    dept: "Operaciones",
    priority: "P1",
    status: "en_progreso",
    hoursAgo: 1,
  },
  {
    practice: "incidente",
    subject: "Teams sin audio en llamadas",
    description: "El indicador del micrófono no se mueve.",
    requester: "R. Ledesma",
    dept: "Marketing",
    priority: "P3",
    status: "resuelto",
    hoursAgo: 20,
  },
  {
    practice: "requerimiento",
    subject: "Licencia de Adobe para el diseñador",
    description: "Se autorizó una licencia individual para la incorporación.",
    requester: "V. Ocampo",
    dept: "Marketing",
    priority: "P3",
    status: "nuevo",
    hoursAgo: 9,
  },
  {
    practice: "requerimiento",
    subject: "Alta de correo para practicante",
    description: "Practicante de RH por 6 meses; crear buzón y listas.",
    requester: "T. Navarro",
    dept: "Recursos Humanos",
    priority: "P4",
    status: "en_progreso",
    hoursAgo: 26,
  },
];

@Injectable()
export class TicketSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly tickets: Repository<TicketEntity>,
    @InjectRepository(TicketEventEntity)
    private readonly events: Repository<TicketEventEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.tickets.count();
    if (count > 0) {
      void startAuditConsumer().catch((err) =>
        console.error("[bus] consumidor no iniciado:", (err as Error).message),
      );
      return;
    }
    console.log("[incidents-service] sembrando tickets de arranque");
    for (const seed of SEED) {
      const service = new TicketsService(this.tickets, this.events);
      const created = await service.create(
        {
          practice: seed.practice,
          subject: seed.subject,
          description: seed.description,
          requester: seed.requester,
          dept: seed.dept,
          priority: seed.priority,
          attachments: [],
        },
        "Semilla de arranque",
      );
      // Avanza el estado según el seed
      const now = Date.now();
      const backdate = now - seed.hoursAgo * 3_600_000;
      const ticket = await this.tickets.findOne({
        where: { code: created.code },
      });
      if (!ticket) continue;
      ticket.createdAt = new Date(backdate);
      if (seed.status !== "nuevo") {
        await service.patch(
          ticket.code,
          { status: "en_progreso", assignee: "Ana Bustamante" },
          "Semilla",
        );
        if (
          seed.status === "resuelto" ||
          seed.status === "pendiente_usuario"
        ) {
          await service.patch(
            ticket.code,
            { status: seed.status },
            "Semilla",
          );
        }
      }
      ticket.updatedAt = new Date(
        Math.min(now - 60_000, backdate + 3_600_000),
      );
      // Reordena la bitácora en el tiempo del seed
      const evs = await this.events.find({ where: { ticketId: ticket.id } });
      for (const [i, ev] of evs.entries()) {
        ev.at = new Date(backdate + i * 180_000);
        await this.events.save(ev);
      }
      await this.tickets.save(ticket);
    }
    console.log(`[incidents-service] ${SEED.length} tickets sembrados`);
    void startAuditConsumer().catch((err) =>
      console.error("[bus] consumidor no iniciado:", (err as Error).message),
    );
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url:
        process.env.DATABASE_URL ??
        "postgres://tickit:tickit@localhost:5432/incidents",
      entities: [TicketEntity, TicketEventEntity, DailyMetricEntity],
      synchronize: false,
      migrations: [__dirname + "/migrations/*.{js,ts}"],
      migrationsRun: true,
    }),
      TypeOrmModule.forFeature([TicketEntity, TicketEventEntity, DailyMetricEntity]),
      ScheduleModule.forRoot(),
    JwtModule.register({
      secret: getJwtSecret(),
    }),
  ],
  controllers: [PromMetricsController, TicketsController, HealthController, MetricsController, AttachmentsController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor }, TicketsService, TicketSeeder, MetricsService, JwtGuard],
})
export class AppModule {}
