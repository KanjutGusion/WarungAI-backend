import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { PrismaService } from './prisma/prisma.service';
import { ResponseService } from './response/response.service';
import { ErrorFilter } from './error/error.filter';
import { JwtGuard } from './guards/jwt.guard';
import { AiService } from './ai/ai.service';
import { ExportService } from './export/export.service';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  providers: [
    ResponseService,
    PrismaService,
    AiService,
    ExportService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },
  ],
  exports: [ResponseService, PrismaService, AiService, ExportService],
})
export class CommonModule {}
