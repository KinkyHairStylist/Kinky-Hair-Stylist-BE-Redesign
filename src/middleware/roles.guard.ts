import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) return false;

    // role object contains isAdmin, isSuperAdmin, etc.
    const roleObj = user.role;

    return requiredRoles.some((role) => {
      switch (role) {
        case Role.SuperAdmin:
          return roleObj.isSuperAdmin;
        case Role.Admin:
          return roleObj.isAdmin;
        case Role.Business:
          return roleObj.isBusiness;
        case Role.Staff:
          return roleObj.isStaff;
        case Role.Client:
          return roleObj.isClient;
        default:
          return false;
      }
    });
  }
}
