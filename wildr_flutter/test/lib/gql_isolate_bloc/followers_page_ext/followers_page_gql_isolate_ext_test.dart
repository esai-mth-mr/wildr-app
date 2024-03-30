import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_cta_events.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_event.dart';
import 'package:wildr_flutter/gql_isolate_bloc/followers_page_ext/followers_page_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';

import '../../../helper/test_configure_flavor.dart';
import '../test_helpers_gql_isolate_bloc.dart';

void main() {
  final requestResponseFiles = {
    'request_getFollowersList_unknown_user':
        'response_getFollowersList_error_user_not_found',
    'request_getFollowersList_valid_user':
        'response_getFollowersList_valid_user',
    'request_removeFollower_valid_user': 'response_removeFollower_valid_user',
    'request_removeFollower_not_following_user':
        'response_removeFollower_not_following_user',
    'request_removeFollower_unauthorized':
        'response_removeFollower_unauthorized',
  };
  const testRoot = 'followers_page_ext';

  group('FollowersPageGqlIsolateBlocExt', () {
    setUp(() async {
      await TestConfigureFlavor.configureFlavor();
    });

    test('FollowersTabPaginateMembersListEvent returns user not found',
        () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_getFollowersList_unknown_user'],
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
        if (state is FollowersTabPaginateMembersListState) {
          completer.complete();
          expect(state.userListType, UserListType.FOLLOWERS);
          expect(state.errorMessage, 'User not found');
          expect(state.users, null);
          expect(state.endCursor, null);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(FollowersTabPaginateMembersListEvent('unknownUser'));

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });

    test('FollowersTabPaginateMembersListEvent returns followers list',
        () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_getFollowersList_valid_user'],
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
        if (state is FollowersTabPaginateMembersListState) {
          completer.complete();
          expect(state.userListType, UserListType.FOLLOWERS);
          expect(state.errorMessage, null);
          expect(state.users?.length, 3);
          expect(state.endCursor, 'et7ykZ8Hq9uIHK7J');
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc
          .add(FollowersTabPaginateMembersListEvent('z_KppmO-EhXpe25f'));

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });
    test('FollowersTabRemoveFollowerEvent unauthorized', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_removeFollower_unauthorized'],
          requestResponseFiles,
          testRoot,
        ),
      );

      final WildrGqlIsolateBlocWrapper<GqlIsolateState> gqlBloc =
          createIsolateBloc<GraphqlIsolateBloc, GqlIsolateState>();

      // Waits until all test assertions are executed.
      final completer = [
        Completer<void>(), // For RemoveFollowerState
        Completer<void>(), // For Perform401LogoutFromGqlIsolateState
      ];

      gqlBloc.stream.listen((state) {
        debugPrint('Received state on stream ${state.toString()}');
        if (state is RemoveFollowerState) {
          completer[0].complete();
          expect(state.isSuccessful, false);
          expect(state.errorMessage, 'Oops! Something went wrong');
          expect(state.index, null);
          expect(state.userId, 'unauthorized');
          expect(state.userListType, UserListType.FOLLOWERS);
          expect(state.userListEvent, UserListCTAEvent.REMOVE);
        } else if (state is PerformLogoutFromGqlIsolateState) {
          completer[1].complete();
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc
          .add(FollowersTabRemoveFollowerEvent('unauthorized'))
          .catchError(
        (e) {
          debugPrint(
            'Exception caught during FollowersTabRemoveFollowerEvent: $e',
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

    test('FollowersTabRemoveFollowerEvent not following user', () async {
      // GIVEN
      await initializeIsolateBloc(
        () => TestHelpers.initGqlIsolateBloc(
          ['request_removeFollower_not_following_user'],
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
        if (state is RemoveFollowerState) {
          completer.complete();
          expect(state.isSuccessful, false);
          expect(state.errorMessage, 'Error while removing follower');
          expect(state.index, null);
          expect(state.userId, 'notFollowingUser');
          expect(state.userListType, UserListType.FOLLOWERS);
          expect(state.userListEvent, UserListCTAEvent.REMOVE);
        } else if (state is LogFirebaseState) {
          // Ignored.
        } else {
          throw Exception('Unknown state');
        }
      });

      // WHEN
      await gqlBloc.add(FollowersTabRemoveFollowerEvent('notFollowingUser'));

      // THEN
      await completer.future.timeout(const Duration(seconds: 5));
    });
  });
}
