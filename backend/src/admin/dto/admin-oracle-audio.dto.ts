import { IsString, MinLength } from 'class-validator';

export class AdminOracleAudioDto {
  @IsString()
  @MinLength(2)
  question!: string;

  /** Sarvam / UI language code e.g. hi-IN */
  @IsString()
  language!: string;

  @IsString()
  profileId!: string;
}
