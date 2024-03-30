// ignore_for_file: no_default_cases

import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_query_fragments.dart';
import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';

enum ChallengeConnectionType {
  undefined,
  allEntriesConnection,
  todayEntriesConnection,
  featuredEntriesConnection,
  userEntriesConnection,
  currentUserEntriesConnection,
  participantsConnection,
  leaderboardConnection,
  commentsConnection,
}

extension ChallengeConnectionTypeTitle on ChallengeConnectionType {
  String get title {
    switch (this) {
      case ChallengeConnectionType.allEntriesConnection:
        return 'All Entries';
      case ChallengeConnectionType.currentUserEntriesConnection:
        return 'My Progress';
      case ChallengeConnectionType.leaderboardConnection:
        return 'Leaderboard';
      default:
        return 'Undefined';
    }
  }
}

class ChallengeQueries {
  String get operationName => 'getChallenge';

  String get _challengeDetailsQuery => r'''
query getChallenge($input: GetChallengeInput!) {
  getChallenge(input: $input) {
    __typename
    ... on GetChallengeResult {
      __typename
      challenge {
        __typename
        ...ChallengeFragment
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}
  ''';

  String get singleChallengeDetailsQuery =>
      CreateQuery.createQuery(_challengeDetailsQuery, [
        ChallengeFragments.kAuthor,
        ChallengeFragments.kCover,
        ChallengeFragments.kTimeStamps,
        ChallengeFragments.kStats,
        GFragments.kContentFragment,
        ChallengeFragments.kChallengeDetails,
      ]);

  //region GetJoinedChallenges

  String get getJoinedChallengesOperationName => 'getJoinedChallenges';

  static const String _getJoinedChallengesQuery = r'''
query getJoinedChallenges($input: GetJoinedChallengesInput!) {
  getJoinedChallenges(input: $input) {
    __typename
    ... on SmartError {
      __typename
      message
    }
    ... on GetJoinedChallengesResult {
      __typename
      challenges {
        __typename
        id
        name
        author {
          __typename
          id
          handle
          name
        }
        cover {
          __typename
          ...ChallengeCover
        }
      }
    }
  }
}
  ''';

  String get getJoinedChallengesQuery =>
      CreateQuery.createQuery(_getJoinedChallengesQuery, [
        ChallengeFragments.kCover,
      ]);

  //endregion

  //region GetPostPinnedComment

  String get getChallengePinnedCommentOperationName => 'getPinnedComment';

  static const String _getChallengePinnedCommentQuery = r'''
query getPinnedComment($challengeId: ID!) {
  getChallenge(input: { id: $challengeId }) {
    ...on SmartError {
      __typename
      message
    }
    ... on GetChallengeResult {
      __typename
      challenge {
        __typename
        id
        name
        pinnedComment {
          __typename
          ...CommentFragment
        }
      }
    }
  }
}
  ''';

  String get getChallengePinnedCommentQuery =>
      CreateQuery.createQuery(_getChallengePinnedCommentQuery, [
        GFragments.kCommentWithoutContextFragment,
        GFragments.kContentFragment,
        GFragments.kUserFragment,
        GFragments.kTimestampFragment,
        GFragments.kUserContextFragment,
      ]);

  //endregion

  //Connection Queries
  String getConnectionFragmentName(ChallengeConnectionType entryType) {
    switch (entryType) {
      case ChallengeConnectionType.allEntriesConnection:
      case ChallengeConnectionType.todayEntriesConnection:
      case ChallengeConnectionType.featuredEntriesConnection:
      case ChallengeConnectionType.userEntriesConnection:
      case ChallengeConnectionType.currentUserEntriesConnection:
        return 'ChallengeEntriesConnection';
      case ChallengeConnectionType.participantsConnection:
        return 'ParticipantsConnection';
      case ChallengeConnectionType.leaderboardConnection:
        return 'LeaderboardConnection';
      case ChallengeConnectionType.commentsConnection:
        return 'CommentsConnection';
      case ChallengeConnectionType.undefined:
        return 'undefined';
    }
  }

  String _connectionQuery(ChallengeConnectionType entryType) {
    final String connectionName = entryType.name;
    final String connectionFragmentName = getConnectionFragmentName(entryType);

    if (entryType == ChallengeConnectionType.userEntriesConnection) {
      return '''
query getChallenge(
  \$challengeId: ID!
  \$paginationInput: PaginationInput!
  \$userToSearchForId: ID!
) {
  getChallenge(input: { id: \$challengeId }) {
    ... on GetChallengeResult {
      __typename
      challenge {
        __typename
        id
        name
        isCompleted
        ts {
          start
          expiry
        }
        $connectionName(
          challengeId: \$challengeId
          paginationInput: \$paginationInput
          userToSearchForId: \$userToSearchForId
        ) {
          ...$connectionFragmentName
        }
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}    
  ''';
    }

    return '''
query getChallenge(
  \$challengeId: ID!
  \$paginationInput: PaginationInput!
) {
  getChallenge(input: { id: \$challengeId }) {
    ... on GetChallengeResult {
      __typename
      challenge {
        __typename
        id
        name
        isCompleted
        ts {
          start
          expiry
        }
        $connectionName(
          challengeId: \$challengeId
          paginationInput: \$paginationInput
        ) {
          ...$connectionFragmentName
        }
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}    
  ''';
  }

  String paginateEntriesQuery(ChallengeConnectionType connectionType) =>
      CreateQuery.createQuery(_connectionQuery(connectionType), [
        ChallengeFragments.kEntriesConnection,
        GFragments.kPageInfoFragment,
        GFragments.kCommentFragment,
        GFragments.kUserFragmentGetFeed,
        GFragments.kPostStatsFragment,
        GFragments.kTimestampFragment,
        GFragments.kPostContextFragment,
        GFragments.kContentFragment,
        GFragments.kMediaSourceFragment,
        GFragments.kVideoFragment,
        GFragments.kImageFragment,
        GFragments.kTagFragment,
        GFragments.kMultiMediaPostFragment,
      ]);

  String get paginateParticipantsQuery => CreateQuery.createQuery(
          _connectionQuery(ChallengeConnectionType.participantsConnection), [
        GFragments.kPageInfoFragment,
        ChallengeFragments.kAuthor,
        ChallengeFragments.kParticipantPost,
        ChallengeFragments.kParticipant,
        ChallengeFragments.kParticipantsConnection,
      ]);

  String get paginateLeaderboardsQuery => CreateQuery.createQuery(
          _connectionQuery(ChallengeConnectionType.leaderboardConnection), [
        GFragments.kPageInfoFragment,
        ChallengeFragments.kAuthor,
        ChallengeFragments.kParticipantPost,
        ChallengeFragments.kParticipant,
        ChallengeFragments.kLeaderboardConnection,
      ]);

  String get paginateCommentsQuery => CreateQuery.createQuery(
          _connectionQuery(ChallengeConnectionType.commentsConnection), [
        ChallengeFragments.kAuthor,
        GFragments.kPageInfoFragment,
        GFragments.kContentFragment,
        ChallengeFragments.kCommentFragment,
        ChallengeFragments.kCommentsConnection,
      ]);
}
