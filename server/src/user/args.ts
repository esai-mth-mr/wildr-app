import { ArgsType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@ArgsType()
export class LoginArgs {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;

  fcmToken?: string;
}

@ArgsType()
export class CheckEmailArgs {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

@ArgsType()
export class CheckHandleArgs {
  @IsNotEmpty()
  handle: string;
}

@ArgsType()
export class Check3rdPartyArgs {
  @IsNotEmpty()
  uid: string;
  @IsNotEmpty()
  providerId: string;
}
