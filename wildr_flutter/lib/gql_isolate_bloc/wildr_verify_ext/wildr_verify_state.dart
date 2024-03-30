import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class WildrVerifyState extends MainState {
  late final bool? isSuccessful;
  late final String? successMessage;
  late final String? errorMessage;

  WildrVerifyState({this.errorMessage, this.successMessage})
      : isSuccessful = errorMessage == null;
}
