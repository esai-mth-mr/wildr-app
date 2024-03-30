import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/api_wrappers.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_wrapper.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/replies_ext/replies_state.dart';

import '../../../helper/test_configure_flavor.dart';
import '../test_helpers_gql_isolate_bloc.dart';

void main() {
  final requestResponseFiles = {
    'request_add_reply_success': 'response_add_reply_success',
    'request_add_reply_comment_not_found':
        'response_add_reply_comment_not_found',
    'request_add_reply_unauthorized': 'response_add_reply_unauthorized',
    'request_react_on_reply_success': 'response_react_on_reply_success',
    'request_react_on_reply_reply_not_found':
        'response_react_on_reply_reply_not_found',
    'request_react_on_reply_unLike_success':
        'response_react_on_reply_unLike_success',
  };
  const testRoot = 'replies_ext';
  const commentId = 'C9PZsg8-hBXYqrXO';
  const fakeCommentId = 'test';
  const replyId = 'Bl2It3KeCSxlaX37';
  const fakeReplyId = 'test';

  group('RepliesGqlIsolateBlocExt', () {
    setUp(() async {
      await TestConfigureFlavor.configureFlavor();
    });

    test('AddReplyEvent returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_add_reply_success'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = Completer<void>();

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is AddReplyState) {
          completer.complete();
          expect(state.errorMessage, null);
          expect(state.parentCommentId, commentId);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        AddReplyEvent(
          'test',
          commentId,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('AddReplyEvent returns comment not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_add_reply_comment_not_found'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = Completer<void>();

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is AddReplyState) {
          completer.complete();
          expect(state.errorMessage, 'something went wrong');
          expect(state.parentCommentId, fakeCommentId);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        AddReplyEvent(
          'test',
          fakeCommentId,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('AddReplyEvent returns unauthorized', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_add_reply_unauthorized'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = [
        Completer<void>(), // For Perform401LogoutFromGqlIsolateState
        Completer<void>(), // For AddReplyState
      ];

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is AddReplyState) {
          completer[1].complete();
          expect(state.errorMessage, 'Oops! Something went wrong');
          expect(state.parentCommentId, commentId);
        } else if (state is PerformLogoutFromGqlIsolateState) {
          completer[0].complete();
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      try {
        await gqlBloc.add(
          AddReplyEvent(
            'test',
            commentId,
          ),
        );
      } catch (e) {
        //TODO(WILDR-6224): Assert test to ensure correct exception is thrown.
        if (e is OperationException) {
          debugPrint('OperationException caught: ${e.graphqlErrors}');
          for (final error in e.graphqlErrors) {
            if (error.message == 'Please Login First') {
              debugPrint('User not authorized. Please log in first.');
            }
          }
        } else {
          debugPrint('Exception caught during FollowUserEvent: $e');
        }
      }

      // THEN
      await Future.wait(
        completer.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
      );
    });

    test('ReactOnReplyEvent Like returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_react_on_reply_success'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = Completer<void>();

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is ReactOnReplyState) {
          completer.complete();
          expect(state.errorMessage, null);
          expect(state.liked, true);
          expect(state.replyId, replyId);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        ReactOnReplyEvent(
          replyId: replyId,
          liked: true,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('ReactOnReplyEvent returns reply not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_react_on_reply_reply_not_found'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = Completer<void>();

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is ReactOnReplyState) {
          completer.complete();
          expect(state.errorMessage, 'Sorry, reply not found');
          expect(state.liked, false);
          expect(state.replyId, 'test');
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        ReactOnReplyEvent(
          replyId: fakeReplyId,
          liked: true,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('ReactOnReplyEvent Un-Like returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_react_on_reply_unLike_success'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = Completer<void>();

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is ReactOnReplyState) {
          completer.complete();
          expect(state.errorMessage, null);
          expect(state.liked, false);
          expect(state.replyId, replyId);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        ReactOnReplyEvent(
          replyId: replyId,
          liked: false,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });
  });
}
