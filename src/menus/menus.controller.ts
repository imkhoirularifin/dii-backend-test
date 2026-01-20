import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Menus')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new menu (Admin only)' })
  @ApiResponse({ status: 201, description: 'Menu successfully created' })
  @ApiResponse({ status: 409, description: 'Menu code already exists' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all menus as hierarchical tree' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive menus',
  })
  @ApiResponse({ status: 200, description: 'Menus retrieved successfully' })
  findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ) {
    return this.menusService.findAll(includeInactive);
  }

  @Get('user')
  @ApiOperation({
    summary: 'Get accessible menus for current user based on role',
  })
  @ApiResponse({
    status: 200,
    description: 'User menus retrieved successfully',
  })
  getUserMenus(@CurrentUser() user: CurrentUserData) {
    return this.menusService.getUserAccessibleMenus(user.userId, user.roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get menu by ID with children' })
  @ApiResponse({ status: 200, description: 'Menu retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update menu (Admin only)' })
  @ApiResponse({ status: 200, description: 'Menu successfully updated' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete menu (Admin only)' })
  @ApiResponse({ status: 200, description: 'Menu successfully deleted' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete menu with children',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.menusService.remove(id);
  }
}
