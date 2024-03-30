// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/ext_parse_smart_error.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/models/troll_detection_result_model.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_gql_isolate_bloc_ext.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';

void print(dynamic message) {
  debugPrint('[PostGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [PostGqlIsolateBlocExt]: $message');
}

extension PostGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> createPost(CreatePostEvent event) async {
    final Map<String, dynamic> input;
    try {
      input = event.getInput();
    } catch (e) {
      printE(e);
      emit(PostCreationFailedState());
      return;
    }
    final QueryResult res = await gService.performMutation(
      PostQueries().getCreatePostMutation,
      operationName: 'createMultiMediaPost',
      variables: input,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, res);
    if (res.data != null) {
      if (errorMessage == null) {
        final PostTrollDetectedData? trollData =
            res.createPostTrollDetectedData();
        if (trollData == null) {
          emit(NewPostCreatedState(isStory: event.isStory, event.challengeId));
        } else {
          debugPrint('TROLL DATA NOT EQUAL NULL');
          emit(
            PostTrollingDetectedState(
              trollData,
              event.processedPostData ?? [],
            ),
          );
        }
      } else {
        emit(PostCreationFailedState(message: errorMessage));
      }
    } else {
      emit(PostCreationFailedState());
    }
  }

  Future<void> deletePost(DeletePostEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kDeletePost,
      variables: event.getInput(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    final bool isSuccessful = errorMessage == null;
    emit(
      DeletePostState(
        isSuccessful: isSuccessful,
        errorMessage: errorMessage,
        index: event.index,
        postId: event.postId,
      ),
    );
    await refetchCurrentUserPosts();
    await refreshCurrentUserDetails(
      RefreshCurrentUserDetailsEvent(currentUser?.id ?? ''),
    );
  }

  Future<void> getPost(GetSinglePostEvent event) async {
    final ObservableQuery? observableQuery = gService.performWatchQuery(
      event.query(),
      variables: event.variables(),
      operationName: 'getPost',
    );
    if (observableQuery == null) {
      emit(
        GetSinglePostDataUpdateState(
          event.pageId,
          errorMessage: kSomethingWentWrong,
        ),
      );
      return;
    }
    singlePostPageStreamSubscriptions[event.pageId] =
        observableQuery.stream.listen((result) {
      String? errorMessage;
      Post? post;
      bool isLoading = false;
      if (result.source == QueryResultSource.network) {
        errorMessage = getErrorMessageFromResultAndLogEvent(event, result);
      }
      if (isDisconnected) {
        errorMessage = kNoInternetError;
      } else if (result.hasException) {
        errorMessage ??= kSomethingWentWrong;
        printE(result.exception);
      } else if (result.data != null) {
        errorMessage ??= result.smartErrorMessage();
        if (errorMessage == null) {
          post = parsePostFromNode(result);
        }
      } else if (result.isLoading) {
        isLoading = true;
      } else {
        errorMessage = kSomethingWentWrong;
      }
      emit(
        GetSinglePostDataUpdateState(
          event.pageId,
          post: post,
          errorMessage: errorMessage,
          isLoading: isLoading,
        ),
      );
    });
  }

  Future<void> getPostPinnedComment(GetPostPinnedCommentEvent event) async {
    final QueryResult result = await gService.performQuery(
      PostQueries().getPostPinnedCommentQuery,
      variables: event.getInput(),
      operationName: ChallengeQueries().getChallengePinnedCommentOperationName,
    );
    String? errorMessage = getErrorMessageFromResultAndLogEvent(event, result);
    Post? post;
    if (errorMessage == null) {
      final Map<String, dynamic>? postJson = result.data?['getPost']?['post'];
      if (postJson == null) {
        errorMessage = kSomethingWentWrong;
      } else {
        post = Post.fromNode(postJson);
      }
    }
    emit(
      GetPostPinnedCommentState(
        postId: event.postId,
        errorMessage: errorMessage,
        post: post,
      ),
    );
  }

  Future<void> checkTextPostTrollDetection(CheckTextPostTroll event) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kCheckTroll,
      variables: await event.getInput(),
      operationName: 'detectTrolling',
      shouldPrintLog: true,
    );

    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);

    if (errorMessage != null) {
      emit(
        TextPostTrollDetectionState(errorMessage: errorMessage),
      );
    }
    emit(
      TextPostTrollDetectionState(
        trollResult: TrollDetectionModel.fromJson(result.data),
      ),
    );
  }
}
