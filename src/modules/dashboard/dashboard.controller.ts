import { Controller, Get } from '@nestjs/common';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('snapshots/latest')
  @Auth(Role.ADMIN)
  latestSnapshot() {
    return this.dashboardService.latestSnapshot();
  }
}
