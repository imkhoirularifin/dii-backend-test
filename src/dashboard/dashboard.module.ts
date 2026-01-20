import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PermissionsModule], // Required for PermissionGuard to work
  controllers: [DashboardController],
})
export class DashboardModule {}
