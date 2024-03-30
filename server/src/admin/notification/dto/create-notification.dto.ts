import {
  IsDefined,
  IsString,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { FCMData } from '@verdzie/server/fcm/fcm.service';
import { ActivityVerb } from '@verdzie/server/generated-graphql';

export class CreateNotificationDto {
  @IsString({
    message: 'Title is a required field and must be a string',
  })
  title: string;
  @IsString({
    message: 'Message is a required field and must be a string',
  })
  message: string;
  @ValidateNested()
  @IsDefined({
    message: 'fcmData is required',
  })
  @ValidateFCMData()
  fcmData: FCMData;
}

function ValidateFCMData(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'validateFCMData',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            return false;
          }
          const { verb, route } = value;

          const isValidVerb =
            verb === undefined || Object.values(ActivityVerb).includes(verb);
          const hasBoth = verb !== undefined && route !== undefined;
          const hasNeither = verb === undefined && route === undefined;

          if (!isValidVerb) {
            return false;
          }

          return !(hasBoth || hasNeither);
        },
        defaultMessage(args: ValidationArguments) {
          const object = args.object as Record<string, any>;
          const { verb, route } = object[args.property] || {};

          if (verb !== undefined && !(verb in ActivityVerb)) {
            return 'Verb must be a valid value from ActivityVerb.';
          }

          if (!verb && !route) {
            return args.property + ' must contain verb or route.';
          }

          if (verb && route) {
            return (
              args.property +
              ' must contain either verb or route, but not both.'
            );
          }

          return 'Invalid input.';
        },
      },
    });
  };
}
