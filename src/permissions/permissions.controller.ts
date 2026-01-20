import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Permissions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create role-menu permission (Admin only)' })
  @ApiResponse({ status: 201, description: 'Permission successfully created' })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  @ApiResponse({ status: 404, description: 'Role or menu not found' })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('role/:roleId')
  @ApiOperation({ summary: 'Get permissions for specific role' })
  @ApiResponse({
    status: 200,
    description: 'Role permissions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findByRole(@Param('roleId', ParseUUIDPipe) roleId: string) {
    return this.permissionsService.findByRole(roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update permission CRUD flags (Admin only)' })
  @ApiResponse({ status: 200, description: 'Permission successfully updated' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete permission (Admin only)' })
  @ApiResponse({ status: 200, description: 'Permission successfully deleted' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.remove(id);
  }
}
