import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { AppRouteEnums } from '@verdzie/server/admin/notification/appRouteNames';

export enum NotificationScope {
  ALL = 'ALL',
  USERS = 'USERS',
}

export class SendGeneralNotificationBodyDto {
  @IsEnum(NotificationScope, {
    message: 'Please provide the scope (ALL/USERS)',
  })
  scope: NotificationScope;
  @IsString()
  title: string;
  @IsString()
  body: string;
  @IsString()
  @IsOptional()
  marketingTag: string | undefined;
  @IsString()
  @IsOptional()
  imageUrl: string | undefined;
  @IsOptional()
  @IsArray()
  userIds?: string[];
  @IsOptional()
  @IsString()
  routeName?: string; // Deprecated; use `routes` instead
  @IsOptional()
  @IsEnum(ActivityVerb)
  verb?: ActivityVerb;
  @IsOptional()
  @IsString()
  challengeId?: string;
  @IsOptional()
  @IsString()
  postId?: string; // for deep linking in notifications
  @IsOptional()
  @IsString()
  userId?: string; // for deep linking in notifications
  @IsArray()
  @IsOptional()
  @IsEnum(AppRouteEnums, { each: true }) // each: true ensures that every element of the array is checked against the enum
  routes?: AppRouteEnums[];
}
