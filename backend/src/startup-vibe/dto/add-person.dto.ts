import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class AddPersonDto {
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  /** YYYY-MM-DD */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dob must be YYYY-MM-DD' })
  dob!: string;

  /** HH:mm (24h) */
  @IsString()
  @Matches(/^\d{1,2}:\d{2}$/, { message: 'tob must be HH:mm' })
  tob!: string;

  @IsString()
  @IsNotEmpty()
  pobCity!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  pobLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  pobLon?: number;

  /** IANA (e.g. Asia/Kolkata) or numeric hours offset (e.g. 5.5) */
  @IsOptional()
  @IsString()
  pobTz?: string;

  @IsOptional()
  @IsString()
  rolePreference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(7)
  positionIndex?: number;
}
