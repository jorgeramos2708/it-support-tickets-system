import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = Number(process.env.PORT ?? 4001);
  if (process.env.SWAGGER !== "false") {
    const { DocumentBuilder, SwaggerModule } = await import("@nestjs/swagger");
    const config = new DocumentBuilder()
      .setTitle("TickITFlow Auth")
      .setDescription("API del microservicio auth de TickITFlow")
      .setVersion("0.1")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
    console.log(`[auth-service] Swagger en :${port}/api/docs`);
  }
  await app.listen(port);
  console.log(`[auth-service] escuchando en :${port}`);
}

void bootstrap();
