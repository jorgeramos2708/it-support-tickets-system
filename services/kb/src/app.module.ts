import { APP_INTERCEPTOR } from "@nestjs/core";
import { Injectable, Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { ArticleEntity } from "./article.entity";
import { HealthController, KbController } from "./kb.controller";
import { JwtGuard } from "./jwt.guard";
import { PromMetricsController, HttpMetricsInterceptor } from "./prom.metrics.controller";

const d = (days: number) => days * 24 * 3_600_000;

const SEED: Array<{
  title: string;
  practice: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  views: number;
  helpful: number;
  daysAgo: number;
}> = [
  {
    title: "Conectar la VPN corporativa correctamente",
    practice: "incidente",
    summary:
      "Configuración recomendada del cliente VPN y solución al error «verificando» que se queda colgado.",
    sections: [
      {
        heading: "Configuración recomendada",
        body: "Usa el cliente corporativo versión 7.2 o superior. En preferencias, activa «Reconectar automáticamente» y desactiva «Túnel dividido». La puerta de enlace recomendada para la región centro es la número dos.",
      },
      {
        heading: "Si se queda en «verificando»",
        body: "Cierra el cliente por completo (incluido el icono de la bandeja), espera diez segundos y vuelve a abrirlo. Si persiste, cambia a la puerta de enlace tres y conéctate de nuevo. No reinstales el cliente: las credenciales guardadas se pierden.",
      },
      {
        heading: "Horario punta",
        body: "Entre 8:30 y 9:30 la capacidad está al límite. Si no necesitas acceso inmediato, espera a las 9:45; el problema de capacidad está bajo investigación con registro PRB-3002.",
      },
    ],
    views: 342,
    helpful: 289,
    daysAgo: 5,
  },
  {
    title: "Desbloquear tu cuenta de dominio en tres pasos",
    practice: "incidente",
    summary:
      "Si tu cuenta quedó bloqueada por intentos fallidos, puedes desbloquearla tú mismo desde el portal sin llamar a soporte.",
    sections: [
      {
        heading: "Antes de empezar",
        body: "El sistema bloquea la cuenta después de cinco intentos fallidos en diez minutos. Espera dos minutos antes de intentar el desbloqueo; los intentos inmediatos reinician el contador.",
      },
      {
        heading: "Paso a paso",
        body: "Entra al portal con tu número de empleado, elige «Desbloquear cuenta» en tu perfil, confirma con tu teléfono registrado y define una contraseña que cumpla la política: doce caracteres, un número y un símbolo.",
      },
      {
        heading: "Si el desbloqueo falla",
        body: "Cuando el portal responde «cuenta protegida» probablemente exista un bloqueo administrativo por el cierre de mes. Abre un ticket desde el portal y menciona PRB-3001; se atiende con prioridad P2 durante el cierre.",
      },
    ],
    views: 214,
    helpful: 187,
    daysAgo: 2,
  },
  {
    title: "Qué hacer cuando SAP muestra pantalla azul",
    practice: "incidente",
    summary:
      "El error de video al abrir el módulo contable tiene solución remota; no reinstales SAP.",
    sections: [
      {
        heading: "Síntoma",
        body: "Al abrir el módulo de contabilidad la estación se reinicia con un error de controlador de video, en estaciones con el controlador de gráficos de principios del año pasado.",
      },
      {
        heading: "Solución inmediata",
        body: "No pierdes datos: el error ocurre antes de abrir la sesión contable. Abre un ticket con el asunto «pantalla azul al abrir SAP» y el equipo actualiza el controlador por remoto en quince minutos.",
      },
      {
        heading: "Prevención",
        body: "El despliegue del controlador corregido está en el cambio programado del mes; las estaciones que lo recibieron ya no presentan el síntoma.",
      },
    ],
    views: 143,
    helpful: 121,
    daysAgo: 7,
  },
  {
    title: "Resolver atascos en la impresora del piso 2",
    practice: "incidente",
    summary:
      "Cómo liberar la cola de la impresora compartida cuando los documentos pesados la bloquean.",
    sections: [
      {
        heading: "Liberar la cola",
        body: "En el panel de la impresora entra a «Trabajos» y cancela el documento de más de 80 MB. Los PDF pesados del sistema contable son la causa más frecuente; exporta el reporte en calidad media y vuelve a imprimir.",
      },
      {
        heading: "Atasco físico",
        body: "Abre la puerta frontal, retira el fusor con la manija verde y extrae el papel en dirección de la banda. No tires del papel hacia atrás: rasga y deja restos que atascan la siguiente impresión.",
      },
      {
        heading: "Cuándo abrir un ticket",
        body: "Si el error «atasco en fusora» aparece sin papel visible, abre un ticket: el equipo aplicó una corrección remota documentada en PRB-3003.",
      },
    ],
    views: 156,
    helpful: 118,
    daysAgo: 9,
  },
  {
    title: "Solicitar acceso a carpetas compartidas",
    practice: "requerimiento",
    summary:
      "El camino correcto para pedir permisos sobre carpetas de red, sin llamar a la mesa.",
    sections: [
      {
        heading: "Lo que necesitas",
        body: "El identificador de la carpeta (por ejemplo \\\\servidor\\finanzas), el nombre de tu área y la autorización de tu jefe directo. Sin la autorización, la solicitud se devuelve y pierde un día.",
      },
      {
        heading: "Cómo solicitarlo",
        body: "En el catálogo del portal elige «Accesos» y después «Carpeta compartida». Pega el identificador, elige el nivel (lectura o escritura) y anexa el correo de autorización. Se responde en menos de cuatro horas hábiles.",
      },
      {
        heading: "Permisos temporales",
        body: "Para reemplazos de vacaciones marca la casilla «acceso temporal» y define la fecha de expiración; el sistema lo revoca solo y evita auditorías de accesos sobrantes.",
      },
    ],
    views: 98,
    helpful: 76,
    daysAgo: 12,
  },
  {
    title: "Checklist de alta de nuevo empleado (TI)",
    practice: "requerimiento",
    summary:
      "Todo lo que debe existir el día uno para que un empleado nuevo trabaje sin fricción.",
    sections: [
      {
        heading: "Siete días antes",
        body: "Registra la solicitud en el catálogo («Alta de nuevo empleado») con la carta de contratación. El equipo reserva laptop, teléfono de extensión y las licencias de software del puesto.",
      },
      {
        heading: "El día uno",
        body: "Entrega del equipo con imagen corporativa, cuenta de correo activa, acceso a la carpeta del área y multi-factor configurado. La persona del área acompaña al empleado los primeros quince minutos.",
      },
      {
        heading: "Verificación final",
        body: "El ticket de alta no se cierra hasta confirmar: inicio de sesión correcto, correo enviando y recibiendo, y acceso a las dos carpetas del puesto.",
      },
    ],
    views: 67,
    helpful: 58,
    daysAgo: 15,
  },
];

@Injectable()
export class ArticleSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articles: Repository<ArticleEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.articles.count();
    if (count > 0) return;
    const now = Date.now();
    let n = 101;
    for (const seed of SEED) {
      await this.articles.save(
        this.articles.create({
          code: `KB-${n++}`,
          title: seed.title,
          practice: seed.practice,
          summary: seed.summary,
          sections: seed.sections,
          views: seed.views,
          helpful: seed.helpful,
          updatedAt: new Date(now - d(seed.daysAgo)),
        }),
      );
    }
    console.log(`[kb-service] ${SEED.length} artículos sembrados`);
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL ?? "postgres://tickit:tickit@localhost:5432/kb",
      entities: [ArticleEntity],
      synchronize: false,
      migrations: [__dirname + "/migrations/*.{js,ts}"],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([ArticleEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "tickitflow-demo-secret",
    }),
  ],
  controllers: [PromMetricsController, HealthController, KbController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor }, ArticleSeeder, JwtGuard],
})
export class AppModule {}

