import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Booking identifier associated with the feedback.' })
  @IsInt()
  bookingId: number;

  @ApiProperty({ description: 'Customer identifier providing the feedback.' })
  @IsInt()
  customerId: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}
