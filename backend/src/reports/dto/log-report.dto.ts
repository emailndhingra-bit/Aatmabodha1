import { IsString, MaxLength } from 'class-validator';

export class LogReportDto {
  @IsString()
  @MaxLength(200)
  profileName: string;

  @IsString()
  @MaxLength(64)
  reportType: string;

  @IsString()
  @MaxLength(300)
  title: string;

  @IsString()
  @MaxLength(500)
  content: string;

  @IsString()
  @MaxLength(16)
  language: string;
}
