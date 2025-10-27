import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Auth(Role.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Auth(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Auth(Role.ADMIN, Role.CUSTOMER, Role.OWNER)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const currentUser = req.user as { id: number; role: Role } | undefined;
    if (!currentUser) {
      throw new ForbiddenException('Authentication context is missing.');
    }
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only access your own profile.');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Post(':id/loyalty/points')
  @Auth(Role.ADMIN)
  addPoints(
    @Param('id', ParseIntPipe) id: number,
    @Body('points', ParseIntPipe) points: number,
    @Body('reason') reason: string,
  ) {
    return this.usersService.addPoints(id, points, reason);
  }

  @Get(':id/loyalty/rank')
  @Auth(Role.ADMIN, Role.CUSTOMER, Role.OWNER)
  getRank(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const currentUser = req.user as { id: number; role: Role } | undefined;
    if (!currentUser) {
      throw new ForbiddenException('Authentication context is missing.');
    }
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only access your own loyalty rank.');
    }
    return this.usersService.getRank(id);
  }
}
