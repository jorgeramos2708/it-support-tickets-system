import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = Number(process.env.PORT ?? 4003);
  await app.listen(port);
  console.log(`[incidents-service] escuchando en :${port}`);
}

void bootstrap();
