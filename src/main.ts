import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3005'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get('HOST_PORT') ?? 3000;

  const logger = new Logger('Bootstrap');

  await app.listen(port, '0.0.0.0');

  const appUrl = await app.getUrl();

  logger.log(`App is running on: ${appUrl}/${globalPrefix}`);
  logger.log(`API Documentation available at: ${appUrl}/api/docs`);
}
bootstrap();
