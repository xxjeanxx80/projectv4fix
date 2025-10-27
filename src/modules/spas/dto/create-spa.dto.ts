import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpaDto {
  @ApiProperty({ description: 'Display name of the spa.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, description: 'Optional description of the spa.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: 'Address of the spa location.' })
  @IsString()
  @IsOptional()
  address?: string;
}
