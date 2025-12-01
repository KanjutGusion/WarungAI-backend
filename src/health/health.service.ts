import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealth(): { status: string; env: string } {
    return { status: 'ok', env: this.configService.get<string>('NODE_ENV')! };
  }
}
