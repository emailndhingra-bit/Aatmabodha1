import { IsInt, Min } from 'class-validator';

export class UpdateQuotaDto {
  @IsInt()
  @Min(0)
  quota!: number;
}
