import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminQuickChartDto {
  @IsString()
  name!: string;

  @IsString()
  date_of_birth!: string;

  @IsString()
  time_of_birth!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  timezone?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  /** Original form DOB (YYYY-MM-DD) for DB; if omitted, date_of_birth is stored. */
  @IsOptional()
  @IsString()
  storageDateOfBirth?: string;

  /** Original form TOB (HH:mm) for DB; if omitted, time_of_birth is stored. */
  @IsOptional()
  @IsString()
  storageTimeOfBirth?: string;

  @Transform(({ value }) => value === true || value === 'true' || value === 1)
  @IsBoolean()
  permanent!: boolean;
}
