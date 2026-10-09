import { getJwtSecret } from "./jwt-secret";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Injectable, Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { ProblemEntity, type ProblemStatus } from "./problem.entity";
import { HealthController, ProblemsController } from "./problems.controller";
import { JwtGuard } from "./jwt.guard";
import { PromMetricsController, HttpMetricsInterceptor } from "./prom.metrics.controller";

const SEED: Array<{
  title: string;
  description: string;
  status: ProblemStatus;
  causeRaiz: string | null;
  workaround: boolean;
  linkedIncidentCodes: string[];
  assignee: string | null;
  hoursAgo: number;
}> = [
  {
    title: "Bloqueos recurrentes de cuentas de dominio",
    description:
      "Varios incidentes esta semana con cuentas bloqueadas por intentos fallidos, concentrados en Finanzas durante el cierre de mes.",
    status: "investigacion",
    causeRaiz:
      "Hipótesis en validación: el asistente de correo del cierre contable guarda la contraseña anterior y reintenta contra el controlador de dominio.",
    workaround: false,
    linkedIncidentCodes: ["INC-2401"],
    assignee: "Ana Bustamante",
    hoursAgo: 50,
  },
  {
    title: "Degradación de VPN en horario punta",
    description:
      "Usuarios remotos reportan desconexiones entre 8:30 y 9:30, coincidiendo con el arranque de sesiones en sucursales.",
    status: "investigacion",
    causeRaiz: null,
    workaround: true,
    linkedIncidentCodes: ["INC-2401"],
    assignee: "Gonzalo Herrera",
    hoursAgo: 38,
  },
  {
    title: "Atascos de cola en impresoras del piso 2",
    description:
      "Documentos pesados de PDF encolan y bloquean la impresora compartida del pasillo de Finanzas.",
    status: "resuelto",
    causeRaiz:
      "El controlador antiguo no libera el spooler con archivos > 80 MB; se actualizó el driver y se publicó la KB-103.",
    workaround: false,
    linkedIncidentCodes: ["INC-2402"],
    assignee: "Elena Fonseca",
    hoursAgo: 120,
  },
  {
    title: "Latencia intermitente del CRM en horas de cierre",
    description:
      "Consultas de fichas de cliente tardan más de un minuto entre 17:00 y 18:00.",
    status: "nuevo",
    causeRaiz: null,
    workaround: false,
    linkedIncidentCodes: [],
    assignee: null,
    hoursAgo: 14,
  },
  {
    title: "Certificados SSL del portal con vencimientos no monitoreados",
    description:
      "El certificado del portal de proveedores venció sin alerta previa; falta monitoreo de vigencia.",
    status: "resuelto",
    causeRaiz:
      "No existía control de vigencia; se agregó alerta a 30 días en el tablero de infraestructura.",
    workaround: false,
    linkedIncidentCodes: ["INC-2403"],
    assignee: "Carlos Duarte",
    hoursAgo: 96,
  },
];

@Injectable()
export class ProblemSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(ProblemEntity)
    private readonly problems: Repository<ProblemEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.problems.count();
    if (count > 0) return;
    const now = Date.now();
    let n = 3001;
    for (const seed of SEED) {
      const at = new Date(now - seed.hoursAgo * 3_600_000);
      await this.problems.save(
        this.problems.create({
          code: `PRB-${n++}`,
          title: seed.title,
          description: seed.description,
          status: seed.status,
          causeRaiz: seed.causeRaiz,
          workaround: seed.workaround,
          linkedIncidentCodes: seed.linkedIncidentCodes,
          assignee: seed.assignee,
          createdAt: at,
          updatedAt: at,
        }),
      );
    }
    console.log(`[problems-service] ${SEED.length} problemas sembrados`);
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url:
        process.env.DATABASE_URL ??
        "postgres://tickit:tickit@localhost:5432/problems",
      entities: [ProblemEntity],
      synchronize: false,
      migrations: [__dirname + "/migrations/*.{js,ts}"],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([ProblemEntity]),
    JwtModule.register({
      secret: getJwtSecret(),
    }),
  ],
  controllers: [PromMetricsController, HealthController, ProblemsController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor }, ProblemSeeder, JwtGuard],
})
export class AppModule {}

