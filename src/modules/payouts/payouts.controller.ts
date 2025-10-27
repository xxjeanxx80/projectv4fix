import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/enums/role.enum';
import { CompletePayoutDto } from './dto/complete-payout.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { ReviewPayoutDto } from './dto/review-payout.dto';
import { PayoutsService } from './payouts.service';

@ApiTags('payouts')
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  @Auth(Role.OWNER)
  request(@Body() dto: RequestPayoutDto) {
    return this.payoutsService.requestPayout(dto);
  }

  @Patch('review')
  @Auth(Role.ADMIN)
  review(@Body() dto: ReviewPayoutDto) {
    return this.payoutsService.reviewPayout(dto);
  }

  @Patch('complete')
  @Auth(Role.ADMIN)
  complete(@Body() dto: CompletePayoutDto) {
    return this.payoutsService.completePayout(dto);
  }
}
