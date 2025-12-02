import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { ReqWithAuth } from 'src/types';

/**
 * This guard handle the entire APP_GUARD
 * the rule is simple, first, all the routes registered with in this app is private by default, except specity the decorator `@Public()`
 * after that, if the route specify the roles, it'll check with user's jwt, but if not it will just let em go pass this guard
 * @type {JwtGuard}
 * @extends {AuthGuard('jwt')}
 */
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

  /**
   * @notice Check if the route is marked as public
   */
  private _isPublicRoute(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get(Public, context.getHandler());
    return !!isPublic;
  }

  /**
   * @notice Validate JWT token using passport strategy
   */
  private async _validateJwt(context: ExecutionContext): Promise<boolean> {
    try {
      const isValid = await super.canActivate(context);
      return !!isValid;
    } catch {
      return false;
    }
  }

  /**
   * @notice Check if user has required role to access the route
   */
  private _checkUserRole(context: ExecutionContext): boolean {
    const requiredRoles = this._getRequiredRoles(context);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = this._getUserFromRequest(context);

    if (!this._isValidUser(user)) {
      return false;
    }

    return this._userHasRequiredRole(user.role.name, requiredRoles);
  }

  /**
   * @notice Get required roles from route metadata
   */
  private _getRequiredRoles(context: ExecutionContext): string[] {
    return this.reflector.get(Roles, context.getHandler()) || [];
  }

  /**
   * @notice Extract user from request object
   */
  private _getUserFromRequest(context: ExecutionContext) {
    const request: ReqWithAuth = context.switchToHttp().getRequest();
    return request.user;
  }

  /**
   * @notice Validate user object has necessary properties
   */
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

  /**
   * @notice Check if user role is in required roles list
   */
  private _userHasRequiredRole(
    userRole: string,
    requiredRoles: string[],
  ): boolean {
    return requiredRoles.includes(userRole);
  }
}
