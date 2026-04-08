import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChartDto {
  @IsString()
  date_of_birth!: string;

  @IsString()
  time_of_birth!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsString()
  timezone?: string;
}

