import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class LoginSignupFailedState extends MainState {
  final String message;

  LoginSignupFailedState(this.message) : super();
}

class LoginSignupFieldErrorState extends MainState {
  LoginSignupFieldErrorState() : super();
}

class AskForHandleAndNameState extends MainState {
  final String message;

  AskForHandleAndNameState(this.message) : super();
}

class HandleAlreadyTakenState extends MainState {
  final String message;

  HandleAlreadyTakenState(this.message) : super();
}
