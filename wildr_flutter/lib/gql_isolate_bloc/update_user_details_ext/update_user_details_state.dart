import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class UpdateUserDetailsState extends MainState {
  // late final bool isSuccessful;
  late final String? errorMessage;

  UpdateUserDetailsState(/* this.isSuccessful, */ this.errorMessage);
}

class UpdateUserEmailState extends UpdateUserDetailsState {
  UpdateUserEmailState(super.errorMessage);
}

class UpdateUserNameState extends UpdateUserDetailsState {
  UpdateUserNameState(super.errorMessage);
}

class UpdateUserHandleState extends UpdateUserDetailsState {
  UpdateUserHandleState(super.errorMessage);
}

class UpdateUserPhoneNumberState extends UpdateUserDetailsState {
  UpdateUserPhoneNumberState({String? errorMessage}) : super(errorMessage);
}

class UpdateUserAvatarImageState extends UpdateUserDetailsState {
  UpdateUserAvatarImageState(super.errorMessage);
}

class UpdateUserPronounState extends UpdateUserDetailsState {
  UpdateUserPronounState(super.errorMessage);
}

class UpdateBioState extends UpdateUserDetailsState {
  UpdateBioState(super.errorMessage);
}
