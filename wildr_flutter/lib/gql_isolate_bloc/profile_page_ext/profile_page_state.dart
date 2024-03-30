import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class ProfilePageState extends MainState {
  final String pageId;

  ProfilePageState(this.pageId);
}

class UserPageFeedUpdateState extends ProfilePageState {
  final bool hasError;
  final String? errorMessage;
  final List<Post> posts;
  final String endCursor;
  final bool hasReachedEndOfTheList;
  final QueryResultSource? source;

  UserPageFeedUpdateState({
    required this.posts,
    required this.endCursor,
    required String pageId,
    this.hasError = false,
    this.errorMessage,
    this.hasReachedEndOfTheList = false,
    this.source,
  }) : super(pageId);

  UserPageFeedUpdateState.hasError(
    this.errorMessage, {
    required String pageId,
  })  : posts = [],
        endCursor = '',
        hasError = true,
        hasReachedEndOfTheList = false,
        source = null,
        super(pageId);
}

class ProfileLoading extends ProfilePageState {
  ProfileLoading(super.pageId);
}

class ProfileLoadFailed extends ProfilePageState {
  final String message;

  ProfileLoadFailed(
    this.message, {
    required String pageId,
  }) : super(pageId);
}

class ProfileLoadSuccessful extends ProfilePageState {
  final WildrUser user;

  ProfileLoadSuccessful(
    this.user, {
    required String pageId,
  }) : super(pageId);
}

class BlockUserState extends ProfilePageState {
  final bool isSuccessful;
  final String? errorMessage;

  BlockUserState(
    this.errorMessage, {
    required String pageId,
  })  : isSuccessful = errorMessage == null,
        super(pageId);
}

class UnblockUserState extends ProfilePageState {
  final bool isSuccessful;
  final String? errorMessage;

  UnblockUserState(
    this.errorMessage, {
    required String pageId,
  })  : isSuccessful = errorMessage == null,
        super(pageId);
}

class UpdateListVisibilityState extends MainState {
  final bool isSuccessful;
  final String? errorMessage;

  UpdateListVisibilityState({
    this.errorMessage,
  }) : isSuccessful = errorMessage == null;
}

class IsEmailVerifiedState extends MainState {
  final bool isEmailVerified;
  final bool isSuccessful;
  final String? errorMessage;

  IsEmailVerifiedState({
    required this.isEmailVerified,
    this.errorMessage,
  }) : isSuccessful = errorMessage == null;
}
