import { APP_INTERCEPTOR } from "@nestjs/core";
import { Injectable, Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Repository } from "typeorm";
import * as amqp from "amqplib";
import { NotificationEntity } from "./notification.entity";
import { NotificationsController, notificationSubject } from "./notifications.controller";
import { JwtGuard } from "./jwt.guard";
import { deriveAudience, deriveSummary } from "./audience";
import { EmailService } from "./email.service";
import { PromMetricsController, HttpMetricsInterceptor } from "./prom.metrics.controller";

const EXCHANGE = "itil.events";
const QUEUE = "notifications.feed";

@Injectable()
export class BusConsumer implements OnModuleInit {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = process.env.RABBITMQ_URL ?? "amqp://tickit:tickit@localhost:5672";
    for (let attempt = 1; attempt <= 12; attempt++) {
      try {
        const conn = await amqp.connect(url);
        const ch = await conn.createChannel();
        if (!ch) throw new Error("canal no disponible");
        await ch.assertExchange(EXCHANGE, "topic", { durable: true });
        await ch.assertQueue(QUEUE, { durable: true });
        await ch.bindQueue(QUEUE, EXCHANGE, "#");
        await ch.prefetch(10);
        await ch.consume(QUEUE, (msg) => {
          if (!msg) return;
          void (async () => {
            try {
              const body = JSON.parse(
                msg.content.toString(),
              ) as Record<string, unknown>;
              const summary = deriveSummary(body, msg.fields.routingKey);
              const audience = deriveAudience(body);
              const saved = await this.notifications.save(
                this.notifications.create({
                  routingKey: msg.fields.routingKey,
                  code: typeof body.code === "string" ? body.code : null,
                  summary,
                  audience,
                  occurredAt: body.occurredAt
                    ? new Date(String(body.occurredAt))
                    : new Date(),
                }),
              );
              // Push en tiempo real a todos los clientes SSE conectados
              notificationSubject.next({
                id: saved.id,
                routingKey: saved.routingKey,
                code: saved.code,
                summary: saved.summary,
                audience: saved.audience,
                occurredAt: saved.occurredAt.toISOString(),
              });

              // Enviar email si el evento es crítico
              await this.emailService.notify({
                routingKey: saved.routingKey,
                code: saved.code,
                summary: saved.summary,
                audience: saved.audience,
              });
            } catch (err) {
              console.error("[bus] mensaje no procesable:", (err as Error).message);
            } finally {
              ch.ack(msg);
            }
          })();
        });
        console.log("[notification-service] consumiendo itil.events → notifications.feed");
        return;
      } catch (err) {
        console.warn(`[bus] intento ${attempt}/12 fallido:`, (err as Error).message);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    throw new Error("[bus] no se pudo conectar a RabbitMQ");
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url:
        process.env.DATABASE_URL ??
        "postgres://tickit:tickit@localhost:5432/notifications",
      entities: [NotificationEntity],
      synchronize: false,
      migrations: [__dirname + "/migrations/*.{js,ts}"],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([NotificationEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "tickitflow-demo-secret",
    }),
  ],
  controllers: [PromMetricsController, NotificationsController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor }, BusConsumer, JwtGuard, EmailService],
})
export class AppModule {}
