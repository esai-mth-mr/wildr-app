import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/enums/reactions_enums.dart';
import 'package:wildr_flutter/feat_feed/feed_page.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/home_feed_ext/home_feed_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/reaction_ext/reaction_states.dart';

import '../../../helper/test_configure_flavor.dart';
import '../test_helpers_gql_isolate_bloc.dart';

void main() {
  final requestResponseFiles = {
    'request_paginatedFeed1': 'response_paginatedFeed1',
    'request_reactOnPost1': 'response_reactOnPost1',
  };
  const testRoot = 'reaction_ext';

  group('ReactionsGqlIsolateBlocExt', () {
    setUp(() async {
      await TestConfigureFlavor.configureFlavor();
    });

    test('ReactOnPostEvent updates home feed watch query', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_paginatedFeed1', 'request_reactOnPost1'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Counts how many times HomeFeedUpdateState is called.
      var countHomeFeedUpdate = 0;
      // Counts how many times CanPaginateHomeFeedState is called.
      var countCanPaginateHomeFeed = 0;

      // Waits until all test assertions are executed.
      final homeFeedCompleter = [
        Completer<void>(),
        Completer<void>(),
      ];
      final reactedOnPostCompleter = Completer<void>();
      // Waits until all test assertions are executed.
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
            final post = state.posts
                .firstWhere((element) => element.id == 'EfexSxWS5LeMbwA4');
            expect(post.stats.likeCount, 4);
          } else if (countHomeFeedUpdate == 2) {
            // This is the updated like count.
            final post = state.posts
                .firstWhere((element) => element.id == 'EfexSxWS5LeMbwA4');
            expect(post.stats.likeCount, 5);
          }
        } else if (state is ReactedOnPostState) {
          reactedOnPostCompleter.complete();
          expect(state.isSuccessful, true);
          expect(state.postIndex, 0);
          expect(state.errorMessage, null);
          expect(state.reaction, ReactionsEnum.LIKE);
        } else if (state is CanPaginateHomeFeedState) {
          canPaginateCompleter[countCanPaginateHomeFeed++].complete();
          expect(state.canPaginate, true);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      // Fetch home feed and setup watch query and stream.
      await gqlBloc.add(GetFeedEvent(scopeType: FeedScopeType.GLOBAL));

      // Like first post.
      await gqlBloc
          .add(ReactOnPostEvent('EfexSxWS5LeMbwA4', 0, ReactionsEnum.LIKE));

      // THEN
      await Future.wait([
        ...homeFeedCompleter.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
        ...canPaginateCompleter.map(
          (c) => c.future.timeout(const Duration(seconds: 5)),
        ),
      ]);

      await reactedOnPostCompleter.future.timeout(const Duration(seconds: 5));
    });
  });
}
