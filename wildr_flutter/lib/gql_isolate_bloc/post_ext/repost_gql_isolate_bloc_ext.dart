// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'dart:developer';

import 'package:firebase_performance/firebase_performance.dart';
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/ext_parse_smart_error.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/troll_detected_data.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_query_operations.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';

void print(dynamic message) {
  debugPrint('[RepostGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [RepostGqlIsolateBlocExt]: $message');
}

extension RepostGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> repost(RepostEvent event) async {
    final Map<String, dynamic> repostInput = {};
    Trace? uploadPostTrace;
    if (shouldAddTraces) {
      uploadPostTrace = FirebasePerformance.instance.newTrace('repost');
    }
    repostInput['postId'] = event.parentPostId;
    if (event.isStory) {
      repostInput['expirationHourCount'] = 24;
    }
    if (event.shouldBypassTrollDetection) {
      repostInput['shouldBypassTrollDetection'] = true;
      repostInput['negativeIndices'] = event.negativeIndices;
      repostInput['negativeResults'] = event.negativeResults;
    }
    repostInput['accessControl'] = event.postAccessControlRequestVariables();
    repostInput['caption'] = SmartTextCommon().createContentForSubmission(
      event.captionData,
      body: event.captionBody,
      shouldAddContentKey: false,
    );
    final variables = {'repostInput': repostInput};
    debugPrint(variables.toString());
    final QueryResult res = await gService.performMutation(
      RepostQueryOperations().kRepostMutation,
      operationName: 'repost',
      variables: variables,
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, res);
    if (res.data != null) {
      if (errorMessage == null) {
        uploadPostTrace?.putAttribute('repost', 'successful');
        final PostTrollDetectedData? trollData =
            res.createPostTrollDetectedData();
        if (trollData == null) {
          emit(RepostCreatedState(isStory: event.isStory));
        } else {
          emit(RepostTrollingDetectedState(trollData));
        }
      } else {
        uploadPostTrace?.putAttribute('createPost', 'smart_error');
        emit(RepostCreatedFailedState(message: errorMessage));
      }
    } else {
      uploadPostTrace?.putAttribute('createPost', 'failed');
      emit(RepostCreatedFailedState());
    }
    await uploadPostTrace?.stop();
  }

  Future<void> getRepostsFromParentPost(
    PaginateRepostedPostsEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      event.query(),
      operationName: event.operationName(),
      variables: event.getVariables(),
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    List<Post>? repostedPosts;
    if (errorMessage == null && result.data != null) {
      final Map<String, dynamic>? map =
          result.data?[event.operationName()]?['post'];
      if (map != null) {
        final parentPost = Post.fromNode(map);
        repostedPosts = parentPost.repostMeta?.repostedPosts;
      }
    }
    log(repostedPosts.toString());
    emit(
      PaginateRepostedPostsState(
        errorMessage: errorMessage,
        posts: repostedPosts,
      ),
    );
  }
}
