import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/enums/role.enum';
import { ApproveSpaDto } from './dto/approve-spa.dto';
import { CreateSpaDto } from './dto/create-spa.dto';
import { UpdateSpaDto } from './dto/update-spa.dto';
import { SpasService } from './spas.service';

@ApiTags('spas')
@Controller('spas')
export class SpasController {
  constructor(private readonly spasService: SpasService) {}

  @Post()
  @Auth(Role.OWNER)
  create(@Req() req: Request, @Body() dto: CreateSpaDto) {
    const ownerId = (req.user as { sub: number }).sub;
    return this.spasService.create(ownerId, dto);
  }

  @Get()
  @Auth(Role.ADMIN)
  findAll() {
    return this.spasService.findAll();
  }

  @Get(':id')
  @Auth(Role.ADMIN, Role.OWNER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.spasService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN, Role.OWNER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpaDto) {
    return this.spasService.update(id, dto);
  }

  @Patch(':id/approval')
  @Auth(Role.ADMIN)
  approve(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveSpaDto) {
    return this.spasService.approve(id, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.spasService.remove(id);
  }
}
