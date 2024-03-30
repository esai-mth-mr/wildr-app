import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class FollowersTabFollowUserEvent extends MainBlocEvent {
  final String userId;
  final int? index;

  FollowersTabFollowUserEvent(this.userId, {this.index}) : super();

  Map<String, dynamic> getVariables() => {
      'followUserInput': {'userId': userId},
    };
}

class FollowersTabUnfollowUserEvent extends MainBlocEvent {
  final String userId;
  final int? index;

  FollowersTabUnfollowUserEvent(this.userId, {this.index}) : super();

  Map<String, dynamic> getVariables() => {
      'unfollowUserInput': {'userId': userId},
    };
}

class FollowersTabRemoveFollowerEvent extends MainBlocEvent {
  final String userId;
  final int? index;

  FollowersTabRemoveFollowerEvent(this.userId, {this.index}) : super();

  Map<String, dynamic> getVariables() => {
      'removeFollowerInput': {'userId': userId},
    };
}

class FollowersTabPaginateMembersListEvent extends MainBlocEvent {
  final String userId;
  final int? first;
  final int? last;
  final String? after;
  final String? before;

  FollowersTabPaginateMembersListEvent(
    this.userId, {
    this.first = DEFAULT_FIRST_COUNT,
    this.last,
    this.after,
    this.before,
  });

  FollowersTabPaginateMembersListEvent.loadMore(this.userId, this.after)
      : first = DEFAULT_FIRST_COUNT,
        before = null,
        last = null;

  Map<String, dynamic> getVariables() => {
      'input': {
        'userId': userId,
      },
      'first': first,
      'last': last,
      'after': after,
      'before': before,
    };

  String query() => r'''
query getFollowersList(
  $input: GetFollowersListInput!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  getFollowersList(input: $input) {
    ... on SmartError {
      message
    }
    ... on GetFollowersListResult {
      user {
        __typename
        id
        followersList(
          first: $first
          after: $after
          last: $last
          before: $before
        ) {
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              key: id
              id
              name
              handle
              avatarImage {
                uri
              }
              realIdVerificationStatus
              realIdFace {
                uri
              }
              score
              currentUserContext {
                followingUser
              }
            }
          }
        }
      }
    }
  }
}    
    ''';
}
