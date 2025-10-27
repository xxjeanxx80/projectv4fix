import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Post()
  @Auth(Role.ADMIN)
  create(@Body() dto: CreateSystemSettingDto) {
    return this.systemSettingsService.create(dto);
  }

  @Get()
  @Auth(Role.ADMIN)
  findAll() {
    return this.systemSettingsService.findAll();
  }

  @Get(':key')
  @Auth(Role.ADMIN)
  findOne(@Param('key') key: string) {
    return this.systemSettingsService.findOne(key);
  }

  @Patch(':key')
  @Auth(Role.ADMIN)
  update(@Param('key') key: string, @Body() dto: UpdateSystemSettingDto) {
    return this.systemSettingsService.update(key, dto);
  }

  @Delete(':key')
  @Auth(Role.ADMIN)
  remove(@Param('key') key: string) {
    return this.systemSettingsService.remove(key);
  }
}
