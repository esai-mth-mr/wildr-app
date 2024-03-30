// ignore_for_file: must_be_immutable

import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class FollowCTAState extends MainState {
  final String? errorMessage;
  int? index;
  String? pageId;
  String? userId;

  FollowCTAState(
    this.errorMessage, {
    this.index,
    this.pageId,
    this.userId,
  }) : super();
}

class UnfollowCTAState extends MainState {
  final String? errorMessage;
  int? index;
  String? pageId;
  String? userId;

  UnfollowCTAState(
    this.errorMessage, {
    this.index,
    this.pageId,
    this.userId,
  }) : super();
}

class RefreshUserListPageState extends MainState {
  String id;

  RefreshUserListPageState(this.id);
}
