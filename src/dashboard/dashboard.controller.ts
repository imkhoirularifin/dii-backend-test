import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('dashboard')
export class DashboardController {
  @Get()
  @RequirePermission('DASHBOARD', 'view')
  @ApiOperation({
    summary: 'Get dashboard overview (requires view permission)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  getDashboard(@CurrentUser() user: CurrentUserData) {
    return {
      message: 'Dashboard overview',
      user: {
        userId: user.userId,
        username: user.username,
        roleId: user.roleId,
      },
      stats: {
        totalUsers: 150,
        activeUsers: 142,
        totalRoles: 3,
        totalMenus: 5,
      },
    };
  }

  @Get('stats')
  @RequirePermission('DASHBOARD', 'view')
  @ApiOperation({
    summary: 'Get dashboard statistics (requires view permission)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  getStats() {
    return {
      message: 'Dashboard statistics',
      data: {
        usersThisMonth: 25,
        activeSessionsToday: 87,
        systemHealth: 'Good',
        uptime: '99.9%',
      },
    };
  }

  @Post('reports')
  @RequirePermission('DASHBOARD', 'create')
  @ApiOperation({ summary: 'Generate new report (requires create permission)' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  generateReport(@CurrentUser() user: CurrentUserData) {
    return {
      message: 'Report generated successfully',
      report: {
        id: 'report-' + Date.now(),
        generatedBy: user.username,
        generatedAt: new Date().toISOString(),
        type: 'monthly-summary',
      },
    };
  }

  @Patch('settings')
  @RequirePermission('DASHBOARD', 'update')
  @ApiOperation({
    summary: 'Update dashboard settings (requires update permission)',
  })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  updateSettings() {
    return {
      message: 'Dashboard settings updated successfully',
      settings: {
        theme: 'light',
        refreshInterval: 30000,
        showNotifications: true,
      },
    };
  }

  @Delete('cache')
  @RequirePermission('DASHBOARD', 'delete')
  @ApiOperation({
    summary: 'Clear dashboard cache (requires delete permission)',
  })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  clearCache() {
    return {
      message: 'Dashboard cache cleared successfully',
      clearedAt: new Date().toISOString(),
    };
  }

  @Get('public-info')
  @ApiOperation({
    summary: 'Get public dashboard info (no permission required)',
  })
  @ApiResponse({
    status: 200,
    description: 'Public info retrieved successfully',
  })
  getPublicInfo() {
    return {
      message: 'Public dashboard information',
      info: {
        systemVersion: '1.0.0',
        apiVersion: 'v1',
        status: 'operational',
      },
    };
  }
}
