import { Module } from '@nestjs/common';
import { NotaService } from './nota.service';
import { NotaController } from './nota.controller';

@Module({
  providers: [NotaService],
  exports: [NotaService],
  controllers: [NotaController],
})
export class NotaModule {}
