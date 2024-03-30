import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';

import '../../../helper/test_configure_flavor.dart';
import '../test_helpers_gql_isolate_bloc.dart';

void main() {
  final requestResponseFiles = {
    'request_paginatedFeed1': 'response_paginatedFeed1',
    'request_paginatedFeed2': 'response_paginatedFeed2',
  };
  const testRoot = 'home_feed_ext';

  group('HomeFeedGqlIsolateBlocExt', () {
    setUp(() async {
      await TestConfigureFlavor.configureFlavor();
    });

    test('GetFeedEvent returns posts', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_paginatedFeed1'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = [
        Completer<void>(), // for HomeFeedUpdateState
        Completer<void>(), // for CanPaginateHomeFeedState
      ];

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is HomeFeedUpdateState) {
          completer[0].complete();
          expect(state.posts.length, 15);
        } else if (state is CanPaginateHomeFeedState) {
          completer[1].complete();
          expect(state.canPaginate, true);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(GetFeedEvent(scopeType: FeedScopeType.GLOBAL));

      // THEN
      await Future.wait(
        completer.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
      );
    });

    test('GetFeedEvent followed by pagination event returns concatenated posts',
        () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_paginatedFeed1', 'request_paginatedFeed2'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Counts how many times HomeFeedUpdateState is called.
      var countHomeFeedUpdate = 0;
      // Counts how many times CanPaginateHomeFeedState is called.
      var countCanPaginate = 0;

      // Waits until all test assertions are executed.
      final homeFeedCompleter = [
        Completer<void>(),
        Completer<void>(),
      ];
      final canPaginateCompleter = [
        Completer<void>(),
        Completer<void>(),
      ];

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is HomeFeedUpdateState) {
          homeFeedCompleter[countHomeFeedUpdate++].complete();
          if (countHomeFeedUpdate == 1) {
            // This is the initial value from the first HTTP response.
            expect(state.posts.length, 15);
          } else if (countHomeFeedUpdate == 2) {
            // This is the new merged value of the feed with the second
            // HTTP response.
            expect(state.posts.length, 38);
          }
        } else if (state is CanPaginateHomeFeedState) {
          canPaginateCompleter[countCanPaginate++].complete();
          expect(state.canPaginate, true);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(GetFeedEvent(scopeType: FeedScopeType.GLOBAL));
      await Future.delayed(const Duration(seconds: 1));
      // Constant is the id of the last post in response_paginatedFeed1.json.
      await gqlBloc.add(PaginateHomeFeedEvent(endCursor: 'ZQ_UI4Gu1N7YzZla'));

      // THEN
      await Future.wait([
        ...homeFeedCompleter.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
        ...canPaginateCompleter.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
      ]);
    });
  });
}
