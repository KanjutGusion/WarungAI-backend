import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';

import { ResponseService } from 'src/_common/response/response.service';
import { Public } from 'src/_common/decorators/public.decorator';
import { AuthService } from './auth.service';
import type { AuthLoginPayload, AuthRegisterPayload } from './zod';
import type { ReqWithAuth } from 'src/types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseService: ResponseService,
  ) {}

  @HttpCode(200)
  @Public()
  @Post('register')
  async register(@Body() registerReq: AuthRegisterPayload) {
    const data = await this.authService.register(registerReq);

    return this.responseService.success(data);
  }

  @HttpCode(200)
  @Public()
  @Post('login')
  async login(@Body() loginReq: AuthLoginPayload) {
    const data = await this.authService.login(loginReq);

    return this.responseService.success(data);
  }

  @HttpCode(200)
  @Get('me')
  async me(@Req() { auth }: ReqWithAuth) {
    const data = await this.authService.me(auth.user.id);

    return this.responseService.success(data);
  }
}
