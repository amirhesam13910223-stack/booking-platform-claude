import { IsString, MinLength, MaxLength } from 'class-validator';

export class ReasonDto {
  @IsString()
  @MinLength(5, { message: 'دلیل باید حداقل ۵ کاراکتر باشد' })
  @MaxLength(500)
  reason: string;
}
