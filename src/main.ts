import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3005'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'x-school-id'],
  });

  app.setGlobalPrefix('v1');

  app.enableShutdownHooks();
  await app.listen(app.get(ConfigService).get('SERVER_PORT') ?? 3000);
}
bootstrap();
