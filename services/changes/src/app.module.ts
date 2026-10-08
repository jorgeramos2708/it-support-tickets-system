import { APP_INTERCEPTOR } from "@nestjs/core";
import { Injectable, Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Repository } from "typeorm";
import {
  ChangeEntity,
  type ChangeStatus,
  type ChangeType,
  type ChangeRisk,
} from "./change.entity";
import { HealthController, ChangesController } from "./changes.controller";
import { JwtGuard } from "./jwt.guard";
import { PromMetricsController, HttpMetricsInterceptor } from "./prom.metrics.controller";

const SEED: Array<{
  title: string;
  type: ChangeType;
  status: ChangeStatus;
  risk: ChangeRisk;
  ventana: string;
  description: string;
  solicita: string;
  implementador: string | null;
  ciIds: string[];
  approvals: { role: string; state: "pendiente" | "aprobado" | "rechazado" }[];
  hoursAgo: number;
}> = [
  {
    title: "Actualización de firmware del switch núcleo",
    type: "normal",
    status: "en_revision",
    risk: "alto",
    ventana: "Viernes 22:00 – 23:30",
    description:
      "Actualización a la versión 9.2 del switch núcleo para cerrar la vulnerabilidad CVE del enlace de administración, con plan de reversión probado.",
    solicita: "Gonzalo Herrera",
    implementador: "Gonzalo Herrera",
    ciIds: ["CI-1008", "CI-1009"],
    approvals: [
      { role: "Gestor de cambios", state: "aprobado" },
      { role: "CAB — Líder de infraestructura", state: "pendiente" },
      { role: "Implementación", state: "pendiente" },
    ],
    hoursAgo: 28,
  },
  {
    title: "Migración de buzones a Exchange Online — lote 3",
    type: "normal",
    status: "aprobado",
    risk: "medio",
    ventana: "Sábado 02:00 – 06:00",
    description:
      "Tercer lote de migración de buzones (120 usuarios de Ventas y Marketing) con notificación enviada a los afectados.",
    solicita: "Carlos Duarte",
    implementador: "Carlos Duarte",
    ciIds: ["CI-1011"],
    approvals: [
      { role: "Gestor de cambios", state: "aprobado" },
      { role: "CAB — Líder de infraestructura", state: "aprobado" },
      { role: "Implementación", state: "pendiente" },
    ],
    hoursAgo: 60,
  },
  {
    title: "Reemplazo estándar de laptop con renglón aprobado",
    type: "estandar",
    status: "implementado",
    risk: "bajo",
    ventana: "Inmediata",
    description:
      "Cambio estándar pre-aprobado: reposición de equipo con el mismo modelo e imagen corporativa.",
    solicita: "Ana Bustamante",
    implementador: "Ana Bustamante",
    ciIds: ["CI-1003"],
    approvals: [
      { role: "Gestor de cambios", state: "aprobado" },
      { role: "Implementación", state: "aprobado" },
    ],
    hoursAgo: 72,
  },
  {
    title: "Parche de seguridad crítico del portal de proveedores",
    type: "emergencia",
    status: "implementado",
    risk: "alto",
    ventana: "Emergencia — hoy 14:00",
    description:
      "Parche inmediato por divulgación activa de vulnerabilidad en el portal externo; aprobación verbal del ECAB documentada.",
    solicita: "Elena Fonseca",
    implementador: "Elena Fonseca",
    ciIds: ["CI-1006", "CI-1008"],
    approvals: [
      { role: "ECAB — Dirección de TI", state: "aprobado" },
      { role: "Implementación", state: "aprobado" },
    ],
    hoursAgo: 20,
  },
  {
    title: "Ampliación de RAM del servidor de BI",
    type: "normal",
    status: "rechazado",
    risk: "medio",
    ventana: "Domingo 03:00 – 05:00",
    description:
      "Paso de 64 a 128 GB para soportar los tableros de cierre; requiere apagar el nodo principal.",
    solicita: "Carlos Duarte",
    implementador: null,
    ciIds: ["CI-1004"],
    approvals: [
      { role: "Gestor de cambios", state: "aprobado" },
      { role: "CAB — Líder de infraestructura", state: "rechazado" },
      { role: "Implementación", state: "pendiente" },
    ],
    hoursAgo: 88,
  },
];

@Injectable()
export class ChangeSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(ChangeEntity)
    private readonly changes: Repository<ChangeEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.changes.count();
    if (count > 0) return;
    const now = Date.now();
    let n = 4001;
    for (const seed of SEED) {
      const at = new Date(now - seed.hoursAgo * 3_600_000);
      await this.changes.save(
        this.changes.create({
          code: `CHG-${n++}`,
          title: seed.title,
          type: seed.type,
          status: seed.status,
          risk: seed.risk,
          ventana: seed.ventana,
          description: seed.description,
          solicita: seed.solicita,
          implementador: seed.implementador,
          ciIds: seed.ciIds,
          approvals: seed.approvals,
          createdAt: at,
          updatedAt: at,
        }),
      );
    }
    console.log(`[changes-service] ${SEED.length} cambios sembrados`);
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url:
        process.env.DATABASE_URL ??
        "postgres://tickit:tickit@localhost:5432/changes",
      entities: [ChangeEntity],
      synchronize: false,
      migrations: [__dirname + "/migrations/*.{js,ts}"],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([ChangeEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "tickitflow-demo-secret",
    }),
  ],
  controllers: [PromMetricsController, HealthController, ChangesController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor }, ChangeSeeder, JwtGuard],
})
export class AppModule {}

