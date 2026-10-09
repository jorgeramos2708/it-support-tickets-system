import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { getJwtSecret } from "./jwt-secret";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Injectable, Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtGuard } from "./jwt.guard";
import { PromMetricsController, HttpMetricsInterceptor } from "./prom.metrics.controller";

@Injectable()
export class UserSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === "production" && process.env.SEED_DEMO !== "true") {
      console.log("[auth-service] seed de demo desactivado en producción");
      return;
    }
    const count = await this.users.count();
    if (count > 0) return;
    const hash = bcrypt.hashSync("demo1234", 10);
    await this.users.save([
      {
        email: "agente@tickitflow.dev",
        name: "Jorge Ramos",
        role: "agente",
        passwordHash: hash,
      },
      {
        email: "usuario@tickitflow.dev",
        name: "M. Aguilar",
        role: "usuario",
        passwordHash: hash,
      },
      {
        email: "admin@tickitflow.dev",
        name: "Administrador",
        role: "admin",
        passwordHash: hash,
      },
    ]);
    console.log("[auth-service] usuarios de demostración sembrados (demo1234)");
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: "login", ttl: 900_000, limit: 5 },
      { name: "default", ttl: 60_000, limit: 60 },
    ]),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL ?? "postgres://tickit:tickit@localhost:5432/auth",
      entities: [User],
      synchronize: false,
      migrations: [__dirname + "/migrations/*.{js,ts}"],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: "8h" },
    }),
  ],
  controllers: [PromMetricsController, AuthController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor }, { provide: APP_GUARD, useClass: ThrottlerGuard }, AuthService, UserSeeder, JwtGuard],
})
export class AppModule {}
