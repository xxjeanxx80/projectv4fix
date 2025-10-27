import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Spa identifier for the booking.' })
  @IsInt()
  spaId: number;

  @ApiProperty({ description: 'Service identifier for the booking.' })
  @IsInt()
  serviceId: number;

  @ApiProperty({ description: 'Customer identifier making the booking.' })
  @IsInt()
  customerId: number;

  @ApiProperty({ required: false, description: 'Staff member assigned to the booking.' })
  @IsInt()
  @IsOptional()
  staffId?: number;

  @ApiProperty({ description: 'Scheduled date and time for the booking.' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ required: false, description: 'Optional coupon code applied to the booking.' })
  @IsString()
  @IsOptional()
  couponCode?: string;
}
