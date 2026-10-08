import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = Number(process.env.PORT ?? 4006);
  if (process.env.SWAGGER !== "false") {
    const { DocumentBuilder, SwaggerModule } = await import("@nestjs/swagger");
    const config = new DocumentBuilder()
      .setTitle("TickITFlow Changes")
      .setDescription("API del microservicio changes de TickITFlow")
      .setVersion("0.1")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
    console.log(`[changes-service] Swagger en :${port}/api/docs`);
  }
  await app.listen(port);
  console.log(`[changes-service] escuchando en :${port}`);
}

void bootstrap();
