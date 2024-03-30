import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class PaginateReactorsListEvent extends MainBlocEvent {
  final String postId;
  final int? fetchCount; //first
  final String? after;
  final int? last;
  final String? before;

  PaginateReactorsListEvent(
    this.postId,
    this.fetchCount,
    this.after,
    this.last,
    this.before,
  );

  Map<String, dynamic> getVariables() => {
      'postId': postId,
      'first': fetchCount,
      'after': after,
      'last': last,
      'before': before,
    };
}

class ReactorsListCountEvent extends MainBlocEvent {
  final String postId;

  ReactorsListCountEvent(
    this.postId,
  );

  Map<String, dynamic> getVariables() => {
      'postId': postId,
    };
}

class PaginateRealReactorsListEvent extends PaginateReactorsListEvent {
  PaginateRealReactorsListEvent({
    required String postId,
    int? fetchCount,
    String? after,
    int? last,
    String? before,
  }) : super(postId, fetchCount, after, last, before);
}

class RealReactorsCountEvent extends ReactorsListCountEvent {
  RealReactorsCountEvent({
    required String postId,
  }) : super(postId);
}

class PaginateApplaudReactorsListEvent extends PaginateReactorsListEvent {
  PaginateApplaudReactorsListEvent({
    required String postId,
    int? fetchCount,
    String? after,
    int? last,
    String? before,
  }) : super(postId, fetchCount, after, last, before);
}

class ApplaudReactorsCountEvent extends ReactorsListCountEvent {
  ApplaudReactorsCountEvent({
    required String postId,
  }) : super(postId);
}

class PaginateLikeReactorsListEvent extends PaginateReactorsListEvent {
  PaginateLikeReactorsListEvent({
    required String postId,
    int? fetchCount,
    String? after,
    int? last,
    String? before,
  }) : super(postId, fetchCount, after, last, before);
}

class LikeReactorsCountEvent extends ReactorsListCountEvent {
  LikeReactorsCountEvent({
    required String postId,
  }) : super(postId);

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kPostId: postId,
    };
}
