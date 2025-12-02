import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _: Response, next: NextFunction) {
    const token = req.headers['x-api-key'];
    if (!token || token !== this.configService.get('API_KEY')) {
      throw new UnauthorizedException('Invalid API key');
    }
    next();
  }
}
