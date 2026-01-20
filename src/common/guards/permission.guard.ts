import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  PermissionMetadata,
} from '../decorators/permission.decorator';
import { PermissionsService } from '../../permissions/permissions.service';
import { CurrentUserData } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionMetadata =
      this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!permissionMetadata) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: CurrentUserData }>();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User role information not found');
    }

    const hasPermission = await this.permissionsService.checkPermission(
      user.roleId,
      permissionMetadata.menuCode,
      permissionMetadata.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to ${permissionMetadata.action} ${permissionMetadata.menuCode}`,
      );
    }

    return true;
  }
}
