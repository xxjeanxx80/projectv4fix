import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/enums/role.enum';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Auth(Role.CUSTOMER, Role.OWNER, Role.ADMIN)
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get()
  @Auth(Role.ADMIN)
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @Auth(Role.CUSTOMER, Role.OWNER, Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/reschedule')
  @Auth(Role.CUSTOMER, Role.OWNER, Role.ADMIN)
  reschedule(@Param('id', ParseIntPipe) id: number, @Body() dto: RescheduleBookingDto) {
    return this.bookingsService.reschedule(id, dto);
  }

  @Patch(':id/cancel')
  @Auth(Role.CUSTOMER, Role.OWNER, Role.ADMIN)
  cancel(@Param('id', ParseIntPipe) id: number, @Body() dto: CancelBookingDto) {
    return this.bookingsService.cancel(id, dto);
  }
}
