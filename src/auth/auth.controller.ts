import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from 'src/_common/decorators/public.decorator';
import { AuthService } from './auth.service';
import type { ReqWithAuth } from 'src/types';
import { AuthLoginDto } from 'src/_common/dto/auth/auth-login.dto';
import { AuthResponseDto } from 'src/_common/dto/auth/auth-response.dto';
import { CreateUserDto } from 'src/_common/dto/auth/create-user.dto';
import { UserResponseDto } from 'src/_common/dto/auth/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  async register(@Body() registerReq: CreateUserDto): Promise<AuthResponseDto> {
    return this.authService.register(registerReq);
  }

  @HttpCode(200)
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Log in an existing user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  async login(@Body() loginReq: AuthLoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginReq);
  }

  @HttpCode(200)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile successfully retrieved',
    type: UserResponseDto,
  })
  async me(@Req() { user }: ReqWithAuth): Promise<UserResponseDto> {
    return this.authService.me(user.id);
  }
}
