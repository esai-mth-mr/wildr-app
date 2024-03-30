import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/enums/reactions_enums.dart';

class ReactedOnPostState extends MainState {
  final bool isSuccessful;
  final int postIndex;
  final String? errorMessage;
  final ReactionsEnum reaction;

  // ignore: non_constant_identifier_names
  ReactedOnPostState(this.postIndex, this.errorMessage, this.reaction)
      : isSuccessful = errorMessage == null;
}

class TriggerLikeState extends MainState {}
