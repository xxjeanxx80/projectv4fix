import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/decorators/roles.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbacksService } from './feedbacks.service';

@ApiTags('feedbacks')
@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  @Auth(Role.CUSTOMER, Role.ADMIN)
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbacksService.create(dto);
  }

  @Get()
  @Auth(Role.ADMIN)
  findAll() {
    return this.feedbacksService.findAll();
  }

  @Get('booking/:bookingId')
  @Auth(Role.ADMIN, Role.OWNER)
  findForBooking(@Param('bookingId', ParseIntPipe) bookingId: number) {
    return this.feedbacksService.findForBooking(bookingId);
  }
}
