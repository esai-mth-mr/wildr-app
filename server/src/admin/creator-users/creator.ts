import { ArgsType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

@ArgsType()
export class Creator {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  topThreeHandles: string;

  @ValidateIf((o, v) => v.length !== 0)
  @MaxLength(200)
  bio?: string;

  @ValidateIf((o, v) => v.length !== 0)
  @IsString()
  @IsUrl()
  profilePicture: string;

  @IsNotEmpty()
  @IsUrl()
  wildrVerifiedSelfie: string;
}
