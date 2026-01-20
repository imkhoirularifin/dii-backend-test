import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export interface PermissionMetadata {
  menuCode: string;
  action: 'view' | 'create' | 'update' | 'delete';
}

export const RequirePermission = (
  menuCode: string,
  action: 'view' | 'create' | 'update' | 'delete',
) => SetMetadata(PERMISSION_KEY, { menuCode, action } as PermissionMetadata);
