import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AddPersonDto } from './add-person.dto';

const INDUSTRIES = [
  'SaaS',
  'D2C',
  'Deeptech',
  'Services',
  'Healthcare',
  'Fintech',
  'Edtech',
  'Other',
] as const;

const STAGES = ['Idea', 'MVP', 'Launched', 'Scaling', 'Mature'] as const;

const FUNDING = ['Bootstrap', 'Pre-seed', 'Seed', 'Series A+', 'Series B+'] as const;

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsString()
  @IsIn([...INDUSTRIES])
  industry?: string;

  @IsOptional()
  @IsString()
  @IsIn([...STAGES])
  stage?: string;

  @IsOptional()
  @IsString()
  @IsIn([...FUNDING])
  fundingStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** When provided, must contain 2–8 people (F3). Omit for an empty draft session. */
  @ValidateIf((o: CreateSessionDto) => o.people != null)
  @IsArray()
  @ArrayMinSize(2, { message: 'A team must include at least 2 people' })
  @ArrayMaxSize(8, { message: 'A team cannot exceed 8 people' })
  @ValidateNested({ each: true })
  @Type(() => AddPersonDto)
  people?: AddPersonDto[];
}
