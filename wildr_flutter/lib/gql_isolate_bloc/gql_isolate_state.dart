// ignore_for_file: avoid_positional_boolean_parameters

part of 'gql_isolate_bloc.dart';

@immutable
abstract class GqlIsolateState {}

class GraphqlIsolateInitial extends GqlIsolateState {}

abstract class GqlIsolateLoginSignupSuccessfulState extends GqlIsolateState {
  final WildrUserWithToken user;

  GqlIsolateLoginSignupSuccessfulState(this.user);
}

class GqlIsolateLoginSuccessfulState
    extends GqlIsolateLoginSignupSuccessfulState {
  GqlIsolateLoginSuccessfulState(super.user);
}

class GqlIsolateSignupSuccessfulState
    extends GqlIsolateLoginSignupSuccessfulState {
  GqlIsolateSignupSuccessfulState(super.user);
}

class ClearFCMTokenOnServerGqlIsolateState extends GqlIsolateState {
  final bool isSuccessful;

  ClearFCMTokenOnServerGqlIsolateState(this.isSuccessful);
}

class UpdateFcmTokenGqlIsolateState extends GqlIsolateState {
  final bool isSuccessful;

  UpdateFcmTokenGqlIsolateState(this.isSuccessful);
}

class DeleteFCMTokenAndProceedWithLogoutState extends GqlIsolateState {
  final bool isSuccessful;

  DeleteFCMTokenAndProceedWithLogoutState(this.isSuccessful);
}

class PerformLogoutFromGqlIsolateState extends GqlIsolateState {}

class EnableGQLState extends MainState {}

class DisableGQLState extends MainState {}

class TokenRetrivalTakingLongerState extends MainState {}
