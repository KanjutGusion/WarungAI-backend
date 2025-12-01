import * as bcrypt from 'bcrypt';
import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from 'src/_common/prisma/prisma.service';
import { AuthLoginPayload, AuthRegisterPayload } from './zod';
import { Response } from 'express';
import { EUserRole } from 'src/types';
import { User } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: AuthRegisterPayload) {
    const result = await this.prismaService.$transaction(async (tx) => {
      const isUserExist = await tx.user.findFirst({
        where: {
          email: data.email,
        },
      });

      if (isUserExist) throw new ForbiddenException('User already exist');

      data.password = await bcrypt.hash(data.password as string, 10);

      this.logger.log(`Register User: ${data.email}`);

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.password as string,
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
        username: result.user.username,
        phone: result.user.phone,
        email: result.user.email,
        status: result.user.status,
        user_role: {
          role_id: result.user.user_role!.role_id,
          role_name: result.user.user_role!.role.name,
        },
      },
    };
  }

  async login(data: AuthLoginPayload) {
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

    const isMatch = await bcrypt.compare(
      data.password as string,
      user.password,
    );

    if (!isMatch) throw new UnauthorizedException('Username or password wrong');

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    this.logger.log(`Login User: ${user.email ?? user.phone}`);

    return {
      token: this._generateAuthToken(user),
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        status: user.status,
        user_role: {
          id: user.user_role!.role_id,
          name: user.user_role!.role.name,
        },
      },
    };
  }

  async logout(res: Response) {
    res.clearCookie('token');
    return 'Logout Success';
  }

  async me(userId: string) {
    return await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      omit: {
        created_at: true,
        updated_at: true,
        password: true,
      },
      include: {
        user_role: {
          include: {
            role: true,
          },
        },
      },
    });
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
