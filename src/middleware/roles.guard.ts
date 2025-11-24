import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/all_user_entities/user.entity';
import { Role } from './role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    console.log('user: ', user);

    return requiredRoles.some((role) => {
      if (role === Role.SuperAdmin) {
        return user.isSuperAdmin;
      }
      if (role === Role.Admin) {
        return user.isAdmin;
      }
      if (role === Role.Business) {
        return user.isBusiness;
      }
      if (role === Role.Client) {
        return user.isClient;
      }
      return false;
    });
  }
}
