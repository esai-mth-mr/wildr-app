import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/enums/reactions_enums.dart';

class ReactOnPostEvent extends MainBlocEvent {
  final String postId;
  final int postIndex;
  final ReactionsEnum reaction;

  ReactOnPostEvent(
    this.postId,
    this.postIndex,
    this.reaction,
  ) : super();

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kPostId: postId,
      AnalyticsParameters.kReactionType: reaction.name,
    };
}

class TriggerLikeEvent extends MainBlocEvent {}
