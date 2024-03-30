import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/api_wrappers.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_wrapper.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/comments_ext/comments_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';

import '../../../helper/test_configure_flavor.dart';
import '../test_helpers_gql_isolate_bloc.dart';

void main() {
  final requestResponseFiles = {
    'request_add_comment_success': 'response_add_comment_success',
    'request_add_comment_unauthorized': 'response_add_comment_unauthorized',
    'request_add_comment_post_not_found': 'response_add_comment_post_not_found',
    'request_react_on_comment_like_success':
        'response_react_on_comment_like_success',
    'request_react_on_comment_like_challenge_success':
        'response_react_on_comment_like_challenge_success',
    'request_react_on_comment_comment_not_found':
        'response_react_on_comment_comment_not_found',
    'request_react_on_comment_unLike_success':
        'response_react_on_comment_unLike_success',
    'request_pin_comment_success': 'response_pin_comment_success',
    'request_pin_comment_post_not_found': 'response_pin_comment_post_not_found',
    'request_pin_comment_comment_not_found':
        'response_pin_comment_comment_not_found',
    'request_delete_comment_success': 'response_delete_comment_success',
    'request_delete_comment_post_not_found':
        'response_delete_comment__post_not_found',
    'request_delete_comment_comment_not_found':
        'response_delete_comment_comment_not_found',
    'request_flag_comment_success': 'response_flag_comment_success',
    'request_flag_comment_comment_not_found':
        'response_flag_comment_comment_not_found',
    'request_block_commenter_success': 'response_block_commenter_success',
    'request_block_commenter_post_not_found':
        'response_block_commenter_post_not_found',
    'request_paginate_comment1': 'response_paginate_comment1',
    'request_paginate_comment2': 'response_paginate_comment2',
  };
  const testRoot = 'comments_ext';
  const postId = 'QCoGkC95K6ktHsiD';
  const commentId = 'C9PZsg8-hBXYqrXO';
  const flagCommentId = 'aNBfgYgAuRVFbNGi';

  group('CommentsGqlIsolateBlocExt', () {
    setUp(() async {
      await TestConfigureFlavor.configureFlavor();
    });

    test('AddCommentEvent returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_add_comment_success'],
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
        if (state is AddCommentsState) {
          completer.complete();
          expect(state.postNotFound, false);
          expect(state.errorMessage, null);
          expect(state.parentPostId, postId);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        AddCommentEvent(
          'test',
          postId,
          type: Post,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('AddCommentEvent returns unauthorized', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_add_comment_unauthorized'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = [
        Completer<void>(), // For Perform401LogoutFromGqlIsolateState
        Completer<void>(), // For AddCommentsState
      ];

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is AddCommentsState) {
          completer[1].complete();
          expect(state.postNotFound, false);
          expect(state.errorMessage, 'Oops! Something went wrong');
          expect(state.parentPostId, postId);
          expect(state.comment, null);
        } else if (state is PerformLogoutFromGqlIsolateState) {
          completer[0].complete();
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc
          .add(
        AddCommentEvent(
          'test',
          postId,
          type: Post,
        ),
      )
          .catchError(
        (e) {
          debugPrint(
            'Exception caught during AddCommentEvent: $e',
          );
        },
      );

      // THEN
      await Future.wait(
        completer.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
      );
    });

    test('AddCommentEvent returns post not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_add_comment_post_not_found'],
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
        if (state is AddCommentsState) {
          completer.complete();
          expect(state.postNotFound, false);
          expect(state.errorMessage, 'This content may have been deleted');
          expect(state.parentPostId, 'testing');
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        AddCommentEvent(
          'test',
          'testing',
          type: Post,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('ReactOnCommentEvent LIKE returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_react_on_comment_like_success'],
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
        if (state is ReactOnCommentState) {
          completer.complete();
          expect(state.commentId, commentId);
          expect(state.errorMessage, null);
          expect(state.liked, true);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        ReactOnCommentEvent(commentId, liked: true, isChallenge: false),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('ReactOnCommentEvent LIKE challenge returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_react_on_comment_like_challenge_success'],
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
        if (state is ReactOnCommentState) {
          completer.complete();
          expect(state.commentId, 'TSYRprvvaedyrY9Z');
          expect(state.errorMessage, null);
          expect(state.liked, true);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        ReactOnCommentEvent('TSYRprvvaedyrY9Z', liked: true, isChallenge: true),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('ReactOnCommentEvent returns comment not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_react_on_comment_comment_not_found'],
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
        if (state is ReactOnCommentState) {
          completer.complete();
          expect(state.commentId, 'test');
          expect(state.errorMessage, 'Sorry, comment not found');
          expect(state.liked, false);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        ReactOnCommentEvent('test', liked: true, isChallenge: false),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('ReactOnCommentEvent Un-LIKE returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_react_on_comment_unLike_success'],
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
        if (state is ReactOnCommentState) {
          completer.complete();
          expect(state.commentId, commentId);
          expect(state.errorMessage, null);
          expect(state.liked, false);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        ReactOnCommentEvent(commentId, liked: false, isChallenge: false),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('PinCommentEvent returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_pin_comment_success'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = Completer<void>();

      gqlBloc.stream.listen((state) {
        debugPrint('Received event on stream ${state.toString()}');
        if (state is PinACommentResult) {
          completer.complete();
          expect(state.parentPostId, postId);
          expect(state.errorMessage, null);
          expect(state.index, 0);
          expect(state.isSuccessful, true);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        PinCommentEvent(
          postId,
          commentId,
          index: 0,
          type: Post,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('PinCommentEvent returns post not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_pin_comment_post_not_found'],
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
        if (state is PinACommentResult) {
          completer.complete();
          expect(state.parentPostId, 'test');
          expect(state.errorMessage, 'Post not found');
          expect(state.index, 0);
          expect(state.isSuccessful, false);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        PinCommentEvent(
          'test',
          commentId,
          index: 0,
          type: Post,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('PinCommentEvent returns comment not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_pin_comment_comment_not_found'],
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
        if (state is PinACommentResult) {
          completer.complete();
          expect(state.parentPostId, postId);
          expect(state.errorMessage, 'Comment not found');
          expect(state.index, 0);
          expect(state.isSuccessful, false);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        PinCommentEvent(
          postId,
          'test',
          index: 0,
          type: Post,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('DeleteCommentEvent returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_delete_comment_success'],
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
        if (state is DeleteCommentState) {
          completer.complete();
          expect(state.parentPostId, postId);
          expect(state.commentId, commentId);
          expect(state.errorMessage, null);
          expect(state.index, 0);
          expect(state.isSuccessful, true);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        DeleteCommentEvent(postId, commentId, 0),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('DeleteCommentEvent returns post not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_delete_comment_post_not_found'],
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
        if (state is DeleteCommentState) {
          completer.complete();
          expect(state.parentPostId, 'test');
          expect(state.commentId, commentId);
          expect(state.errorMessage, kSomethingWentWrong);
          expect(state.index, 0);
          expect(state.isSuccessful, false);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        DeleteCommentEvent('test', commentId, 0),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('DeleteCommentEvent returns comment not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_delete_comment_comment_not_found'],
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
        if (state is DeleteCommentState) {
          completer.complete();
          expect(state.parentPostId, postId);
          expect(state.commentId, 'test');
          expect(state.errorMessage, kSomethingWentWrong);
          expect(state.index, 0);
          expect(state.isSuccessful, false);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        DeleteCommentEvent(postId, 'test', 0),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('FlagCommentEvent returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_flag_comment_success'],
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
        if (state is FlagCommentState) {
          completer.complete();
          expect(state.operation, FlagCommentOperation.FLAG);
          expect(state.commentId, flagCommentId);
          expect(state.errorMessage, null);
          expect(state.index, 0);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        FlagCommentEvent(
          index: 0,
          commentId: flagCommentId,
          operation: FlagCommentOperation.FLAG,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('FlagCommentEvent returns comment not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_flag_comment_comment_not_found'],
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
        if (state is FlagCommentState) {
          completer.complete();
          expect(state.operation, FlagCommentOperation.FLAG);
          expect(state.commentId, 'test');
          expect(state.errorMessage, kSomethingWentWrong);
          expect(state.index, 0);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        FlagCommentEvent(
          index: 0,
          commentId: 'test',
          operation: FlagCommentOperation.FLAG,
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('BlockCommenterOnPostEvent returns success', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_block_commenter_success'],
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
        if (state is BlockCommenterOnPostState) {
          completer.complete();
          expect(state.operation, CommenterBlockOperation.BLOCK);
          expect(state.handle, 'captain');
          expect(state.errorMessage, null);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        BlockCommenterOnPostEvent(
          handle: 'captain',
          operation: CommenterBlockOperation.BLOCK,
          commenterId: 'yUoT7S13BtO',
          postId: 'A5d6D8fqrY1OYvwb',
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('BlockCommenterOnPostEvent returns comment not found', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_block_commenter_post_not_found'],
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
        if (state is BlockCommenterOnPostState) {
          completer.complete();
          expect(state.operation, CommenterBlockOperation.BLOCK);
          expect(state.handle, 'captain');
          expect(state.errorMessage, kSomethingWentWrong);
        } else if (state is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(
        BlockCommenterOnPostEvent(
          handle: 'captain',
          operation: CommenterBlockOperation.BLOCK,
          commenterId: 'yUoT7S13BtO',
          postId: 'test',
        ),
      );

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('PaginateCommentsEvent returns paginated items', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_paginate_comment1', 'request_paginate_comment2'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Counts how many times HomeFeedUpdateState is called.
      var countPaginateComments = 0;

      // Waits until all test assertions are executed.
      final paginateCommentsCompleter = [Completer<void>(), Completer<void>()];

      gqlBloc.stream.listen((event) {
        debugPrint('Received event on stream ${event.toString()}');
        if (event is PaginateCommentsState) {
          paginateCommentsCompleter[countPaginateComments++].complete();
          if (countPaginateComments == 1) {
            // This is the initial value from the first HTTP response.
            expect(event.comments.length, 10);
            expect(event.comments.first.id, 'rqh_MaGBHY_hx6ow');
            expect(event.comments.first.author.name, 'Hulk');
            expect(event.comments.last.id, 'VBRiDiJsSCjEmv7Z');
            expect(event.comments.last.author.name, 'Kamil');
          } else if (countPaginateComments == 2) {
            expect(event.comments.length, 10);
            expect(event.comments.first.id, 'VBRiDiJsSCjEmv7Z');
            expect(event.comments.first.author.name, 'Kamil');
            expect(event.comments.last.id, 'pOmbGVnaR4D8amTM');
            expect(event.comments.last.author.name, 'Testq');
          }
        } else if (event is LogFirebaseState) {
          // Ignored
        } else {
          throw Exception('Unknown event');
        }
      });

      // WHEN
      await gqlBloc.add(
        PaginateCommentsEvent(
          postId,
          10,
          isRefreshing: true,
          type: Post,
        ),
      );
      await Future.delayed(const Duration(seconds: 1));
      // Constant is the id of the last comment in
      // response_paginate_comment1.json
      await gqlBloc.add(
        PaginateCommentsEvent(
          postId,
          10,
          includingAndAfter: 'VBRiDiJsSCjEmv7Z',
          isRefreshing: true,
          type: Post,
        ),
      );

      // THEN
      await Future.wait([
        ...paginateCommentsCompleter.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
      ]);
    });
  });
}
