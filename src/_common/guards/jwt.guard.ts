import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get(Public, context.getHandler());
    if (!!isPublic) return true;

    const validJwt = await super.canActivate(context);
    if (!validJwt) return false;

    const requiredRoles: string[] = this.reflector.get(
      Roles,
      context.getHandler(),
    );

    // Jika tidak ada roles yang di-require, skip pengecekan role
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const auth = request.auth;

    if (!auth || !auth.roles) return false;

    // Ambil schoolId dari header (jika ada)
    const schoolId = request.headers['x-school-id'] as string;

    // Jika ada schoolId, cek role untuk school tersebut
    if (schoolId && auth.roles[schoolId]) {
      const userRole = auth.roles[schoolId].name;
      return requiredRoles.includes(userRole);
    }

    const userRoles = Object.values(auth.roles);
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
