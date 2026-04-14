import { IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

const REPORT_TYPES = [
  'career_clarity',
  'business_founder',
  'kundli_match_plus',
  'vibe_check',
  'child_destiny',
] as const;

export class GenerateAdminReportDto {
  @IsString()
  @IsIn(REPORT_TYPES as unknown as string[])
  reportType!: string;

  @IsUUID()
  profileIdA!: string;

  @IsOptional()
  @IsUUID()
  profileIdB?: string;

  @IsOptional()
  @IsString()
  tier?: string;

  @IsString()
  language!: string;

  @IsOptional()
  @IsObject()
  flags?: Record<string, unknown>;
}
