import { getJwtSecret } from "./jwt-secret";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Injectable, Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { CiEntity, type CiType, type CiCriticality, type CiEnvironment, type RelationKind } from "./ci.entity";
import { CmdbController, HealthController } from "./cmdb.controller";
import { JwtGuard } from "./jwt.guard";
import { PromMetricsController, HttpMetricsInterceptor } from "./prom.metrics.controller";

type SeedCi = {
  name: string;
  type: CiType;
  environment: CiEnvironment;
  criticality: CiCriticality;
  owner: string;
  relations: { ciId: string; kind: RelationKind }[];
};

const SEED: SeedCi[] = [
  {
    name: "SRV-DC01 — Directorio activo principal",
    type: "servidor",
    environment: "produccion",
    criticality: "alta",
    owner: "Infraestructura",
    relations: [{ ciId: "CI-1008", kind: "conecta_a" }],
  },
  {
    name: "SRV-VPN01 — Puerta de enlace VPN",
    type: "servidor",
    environment: "produccion",
    criticality: "alta",
    owner: "Redes",
    relations: [
      { ciId: "CI-1008", kind: "conecta_a" },
      { ciId: "CI-1009", kind: "conecta_a" },
    ],
  },
  {
    name: "EQ-SOPORTE-04 — Estación de soporte",
    type: "estacion",
    environment: "produccion",
    criticality: "baja",
    owner: "Soporte N1",
    relations: [{ ciId: "CI-1008", kind: "conecta_a" }],
  },
  {
    name: "SRV-BI01 — Servidor de analítica",
    type: "servidor",
    environment: "produccion",
    criticality: "media",
    owner: "Infraestructura",
    relations: [{ ciId: "CI-1008", kind: "conecta_a" }],
  },
  {
    name: "SRV-BKP01 — Servidor de respaldos",
    type: "servidor",
    environment: "produccion",
    criticality: "alta",
    owner: "Infraestructura",
    relations: [
      { ciId: "CI-1008", kind: "conecta_a" },
      { ciId: "CI-1001", kind: "depende_de" },
    ],
  },
  {
    name: "SW-PORTAL-PROV — Portal de proveedores",
    type: "aplicacion",
    environment: "produccion",
    criticality: "alta",
    owner: "Desarrollo",
    relations: [{ ciId: "CI-1001", kind: "depende_de" }],
  },
  {
    name: "SW-CRM01 — CRM corporativo",
    type: "aplicacion",
    environment: "produccion",
    criticality: "media",
    owner: "Desarrollo",
    relations: [{ ciId: "CI-1004", kind: "se_ejecuta_en" }],
  },
  {
    name: "NET-CORE-SW01 — Switch núcleo",
    type: "red",
    environment: "produccion",
    criticality: "alta",
    owner: "Redes",
    relations: [],
  },
  {
    name: "NET-WIFI-P2 — Red inalámbrica piso 2",
    type: "red",
    environment: "produccion",
    criticality: "media",
    owner: "Redes",
    relations: [{ ciId: "CI-1008", kind: "conecta_a" }],
  },
  {
    name: "EQ-IMP-P2-01 — Impresora piso 2",
    type: "impresora",
    environment: "produccion",
    criticality: "baja",
    owner: "Soporte N1",
    relations: [{ ciId: "CI-1009", kind: "conecta_a" }],
  },
  {
    name: "SVC-CORREO — Servicio de correo",
    type: "servicio",
    environment: "produccion",
    criticality: "alta",
    owner: "Infraestructura",
    relations: [{ ciId: "CI-1001", kind: "depende_de" }],
  },
  {
    name: "SVC-VPN — Servicio de acceso remoto",
    type: "servicio",
    environment: "produccion",
    criticality: "alta",
    owner: "Redes",
    relations: [{ ciId: "CI-1002", kind: "se_ejecuta_en" }],
  },
];

@Injectable()
export class CiSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(CiEntity)
    private readonly cis: Repository<CiEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.cis.count();
    if (count > 0) return;
    for (const [i, seed] of SEED.entries()) {
      await this.cis.save(
        this.cis.create({
          code: `CI-${1001 + i}`,
          name: seed.name,
          type: seed.type,
          environment: seed.environment,
          criticality: seed.criticality,
          owner: seed.owner,
          relations: seed.relations,
        }),
      );
    }
    console.log(`[cmdb-service] ${SEED.length} CIs sembrados`);
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url:
        process.env.DATABASE_URL ??
        "postgres://tickit:tickit@localhost:5432/cmdb",
      entities: [CiEntity],
      synchronize: false,
      migrations: [__dirname + "/migrations/*.{js,ts}"],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([CiEntity]),
    JwtModule.register({
      secret: getJwtSecret(),
    }),
  ],
  controllers: [PromMetricsController, HealthController, CmdbController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor }, CiSeeder, JwtGuard],
})
export class AppModule {}

