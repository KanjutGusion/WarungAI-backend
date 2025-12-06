import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { ReqWithAuth } from 'src/types';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this._isPublicRoute(context)) {
      return true;
    }

    if (!(await this._validateJwt(context))) {
      return false;
    }

    return this._checkUserRole(context);
  }

  private _isPublicRoute(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get(Public, context.getHandler());
    return !!isPublic;
  }

  private async _validateJwt(context: ExecutionContext): Promise<boolean> {
    try {
      const isValid = await super.canActivate(context);
      return !!isValid;
    } catch {
      return false;
    }
  }

  private _checkUserRole(context: ExecutionContext): boolean {
    const requiredRoles = this._getRequiredRoles(context);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = this._getUserFromRequest(context);

    if (!this._isValidUser(user)) {
      return false;
    }

    return this._userHasRequiredRole(user.role.name, requiredRoles);
  }

  private _getRequiredRoles(context: ExecutionContext): string[] {
    return this.reflector.get(Roles, context.getHandler()) || [];
  }

  private _getUserFromRequest(context: ExecutionContext) {
    const request: ReqWithAuth = context.switchToHttp().getRequest();
    return request.user;
  }

  private _isValidUser(
    user: unknown,
  ): user is { id: string; role: { id: string; name: string } } {
    return (
      user != null &&
      typeof user === 'object' &&
      'role' in user &&
      (user as { role: unknown }).role != null &&
      typeof (user as { role: unknown }).role === 'object' &&
      'name' in (user as { role: object }).role
    );
  }

  private _userHasRequiredRole(
    userRole: string,
    requiredRoles: string[],
  ): boolean {
    return requiredRoles.includes(userRole);
  }
}
