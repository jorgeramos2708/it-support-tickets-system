import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = Number(process.env.PORT ?? 4007);
  await app.listen(port);
  console.log(`[cmdb-service] escuchando en :${port}`);
}

void bootstrap();
