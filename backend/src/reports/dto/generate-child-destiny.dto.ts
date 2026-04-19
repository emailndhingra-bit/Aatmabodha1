import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class GenerateChildDestinyDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  promptParts!: string[];
}
