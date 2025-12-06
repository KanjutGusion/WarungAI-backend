import * as bcrypt from 'bcrypt';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/_common/prisma/prisma.service';
import { EUserRole } from 'src/types';
import { User } from 'src/generated/prisma/client';
import { AuthLoginDto } from 'src/_common/dto/auth/auth-login.dto';
import { AuthResponseDto } from 'src/_common/dto/auth/auth-response.dto';
import { CreateUserDto } from 'src/_common/dto/auth/create-user.dto';
import { UserResponseDto } from 'src/_common/dto/auth/user-response.dto';
import { ForgotPasswordDto } from 'src/_common/dto/auth/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: CreateUserDto): Promise<AuthResponseDto> {
    const result = await this.prismaService.$transaction(async (tx) => {
      const isUserExist = await tx.user.findFirst({
        where: {
          email: data.email,
        },
      });

      if (isUserExist) throw new ForbiddenException('User already exist');

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          username: data.username,
          phone: data.phone,
          user_role: {
            create: {
              role: {
                connect: {
                  name: EUserRole.SELLER,
                },
              },
            },
          },
        },
        include: {
          user_role: {
            include: {
              role: true,
            },
          },
        },
      });

      return { user };
    });

    return {
      token: this._generateAuthToken(result.user),
      user: {
        id: result.user.id,
        username: result.user.username ?? null,
        phone: result.user.phone ?? null,
        email: result.user.email!,
        status: result.user.status,
        user_role: {
          id: result.user.user_role!.role_id,
          name: result.user.user_role!.role.name as EUserRole,
        },
      },
    };
  }

  async login(data: AuthLoginDto): Promise<AuthResponseDto> {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: data.email,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        password: true,
        status: true,
        user_role: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Username or password wrong');

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) throw new UnauthorizedException('Username or password wrong');

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    return {
      token: this._generateAuthToken(user),
      user: {
        id: user.id,
        username: user.username ?? null,
        phone: user.phone ?? null,
        email: user.email!,
        status: user.status,
        user_role: {
          id: user.user_role!.role_id,
          name: user.user_role!.role.name as EUserRole,
        },
      },
    };
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        user_role: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      username: user.username ?? null,
      phone: user.phone ?? null,
      email: user.email!,
      status: user.status,
      user_role: {
        id: user.user_role!.role_id,
        name: user.user_role!.role.name as EUserRole,
      },
    };
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    const isOldPasswordMatch = await bcrypt.compare(
      data.oldPassword,
      user.password,
    );

    if (!isOldPasswordMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedNewPassword,
      },
    });

    return {
      message: 'Password successfully changed',
    };
  }

  private _generateAuthToken(
    user: Partial<User> & {
      user_role?: {
        role_id: string;
        role: {
          name: string;
        };
      } | null;
    },
  ) {
    return this.jwtService.sign({
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        status: user.status,
        role: {
          id: user.user_role?.role_id,
          name: user.user_role?.role.name,
        },
      },
    });
  }
}
