import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from 'src/_common/decorators/public.decorator';
import { ResponseService } from 'src/_common/response/response.service';
import { BaseResponse } from 'src/_common/response/base-response';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly responseService: ResponseService,
  ) {}

  @Public()
  @Get()
  check(): BaseResponse<{ status: string; env: string }> {
    const res = this.healthService.getHealth();

    return this.responseService.success(res);
  }
}
