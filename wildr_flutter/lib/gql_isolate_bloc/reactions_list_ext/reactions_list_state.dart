import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class PaginateRealReactorsListState extends MainState {
  final String? errorMessage;
  final List<WildrUser>? users;
  final String? startCursor;
  final String? endCursor;
  final int? totalCount;

  PaginateRealReactorsListState({
    this.errorMessage,
    this.users,
    this.startCursor,
    this.endCursor,
    this.totalCount,
  });
}

class RealReactorsCountState extends MainState {
  final String? errorMessage;
  final int? totalCount;

  RealReactorsCountState({this.errorMessage, this.totalCount});
}

class PaginateApplaudReactorsListState extends MainState {
  final String? errorMessage;
  final List<WildrUser>? users;
  final String? startCursor;
  final String? endCursor;
  final int? totalCount;

  PaginateApplaudReactorsListState({
    this.errorMessage,
    this.users,
    this.startCursor,
    this.endCursor,
    this.totalCount,
  });
}

class ApplaudReactorsCountState extends MainState {
  final String? errorMessage;
  final int? totalCount;

  ApplaudReactorsCountState({this.errorMessage, this.totalCount});
}

class PaginateLikeReactorsListState extends MainState {
  final String? errorMessage;
  final List<WildrUser>? users;
  final String? startCursor;
  final String? endCursor;
  final int? totalCount;

  PaginateLikeReactorsListState({
    this.errorMessage,
    this.users,
    this.startCursor,
    this.endCursor,
    this.totalCount,
  });
}

class LikeReactorsCountState extends MainState {
  final String? errorMessage;
  final int? totalCount;

  LikeReactorsCountState({this.errorMessage, this.totalCount});
}
