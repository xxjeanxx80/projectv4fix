import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/decorators/roles.decorator';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { RequestTimeOffDto } from './dto/request-time-off.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Auth(Role.ADMIN, Role.OWNER)
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Get()
  @Auth(Role.ADMIN, Role.OWNER)
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  @Auth(Role.ADMIN, Role.OWNER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN, Role.OWNER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN, Role.OWNER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }

  @Post(':id/shifts')
  @Auth(Role.ADMIN, Role.OWNER)
  assignShift(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignShiftDto) {
    return this.staffService.assignShift(id, dto);
  }

  @Post(':id/time-off')
  @Auth(Role.ADMIN, Role.OWNER)
  requestTimeOff(@Param('id', ParseIntPipe) id: number, @Body() dto: RequestTimeOffDto) {
    return this.staffService.requestTimeOff(id, dto);
  }
}
