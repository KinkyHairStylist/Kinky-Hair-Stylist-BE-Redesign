import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { Roles } from 'src/middleware/roles.decorator';
import { Role } from 'src/middleware/role.enum';
import { RolesGuard } from 'src/middleware/roles.guard';
import { GuidelinesService } from './guidelines.service';
import { UpdateGuidelineDto } from './DTOs/updateguideline.dto';

@ApiTags('Admin Guidelines')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Staff)
@Controller('admin/guidelines')
export class GuidelinesController {
  constructor(private readonly service: GuidelinesService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Patch()
  updateAll(@Body() dto: UpdateGuidelineDto[]) {
    return this.service.updateAll(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGuidelineDto) {
    return this.service.update(id, dto);
  }
}