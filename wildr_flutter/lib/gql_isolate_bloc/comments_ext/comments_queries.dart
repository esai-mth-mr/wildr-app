import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_query_fragments.dart';
import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';

class CommentsGqlQueries {
  final _paginateCommentsOnPostQuery = r'''
query paginatedComments(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
  $includingAndAfter: String
  $targetCommentId: ID
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on SmartError {
      __typename
      message
    }
    ... on GetPostResult {
      __typename
      post {
        __typename
        ... on MultiMediaPost {
          __typename
          id
        }
        commentsConnection(
          postId: $postId
          first: $first
          after: $after
          last: $last
          before: $before
          includingAndAfter: $includingAndAfter
          targetCommentId: $targetCommentId
        ) {
          __typename
          pageInfo {
            __typename
            ...PageInfoFragment
          }
          edges {
            __typename
            cursor
            node {
              __typename
              ...CommentFragment
            }
          }
          targetCommentError
        }
        commentPostingAccessControlContext {
          __typename
          ...CommentPostingAccessControlContextFragment
        }
        commentVisibilityAccessControlContext {
          __typename
          ...CommentVisibilityAccessControlContextFragment
        } 
      }
    }
  }
}

''';
  final _paginateCommentsOnChallengeQuery = r'''
query paginatedComments(
  $challengeId: ID!
  $paginationInput: PaginationInput!
) {
  getChallenge(input: { id: $challengeId }) {
    ... on GetChallengeResult {
      __typename
      challenge {
        __typename
        id
        name
        commentsConnection(
          challengeId: $challengeId
          paginationInput: $paginationInput
        ) {
          __typename
          ...ChallengeCommentsConnection
        }
        isCompleted
      }
    }
    ... on SmartError {
      __typename
      message
    }
  }
}
''';

  String get paginateCommentsOnChallenge =>
      CreateQuery.createQuery(_paginateCommentsOnChallengeQuery, [
        GFragments.kPageInfoFragment,
        GFragments.kContentFragment,
        GFragments.kUserFragmentWithoutContextAndStats,
        GFragments.kCommentFragment,
        ChallengeFragments.kChallengeCommentsConnection,
        // GFragments.kCommentPostingAccessControlContextFragment,
        // GFragments.kCommentVisibilityAccessControlContextFragment,
      ]);

  String get paginateCommentsOnPost =>
      CreateQuery.createQuery(_paginateCommentsOnPostQuery, [
        GFragments.kPageInfoFragment,
        GFragments.kContentFragment,
        GFragments.kUserFragmentWithoutContextAndStats,
        GFragments.kCommentFragment,
        GFragments.kCommentPostingAccessControlContextFragment,
        GFragments.kCommentVisibilityAccessControlContextFragment,
      ]);

  String get paginatedCommentsWithoutCanCommentStatus {
    const query = r'''
query paginatedComments(
  $postId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
  $includingAndAfter: String
  $targetCommentId: ID
) {
  getPost(input: { id: $postId }) {
    __typename
    ... on SmartError {
      __typename
      message
    }
    ... on GetPostResult {
      __typename
      post {
        __typename
        ... on MultiMediaPost {
          __typename
          id
        }
        commentsConnection(
          postId: $postId
          first: $first
          after: $after
          last: $last
          before: $before
          includingAndAfter: $includingAndAfter
          targetCommentId: $targetCommentId
        ) {
          pageInfo {
            __typename
            ...PageInfoFragment
          }
          edges {
            __typename
            cursor
            node {
              __typename
              ...CommentFragment
            }
          }
          targetCommentError
        }
      }
    }
  }
}
''';
    return CreateQuery.createQuery(query, [
      GFragments.kPageInfoFragment,
      GFragments.kContentFragment,
      GFragments.kUserFragmentWithoutContextAndStats,
      GFragments.kCommentFragment,
    ]);
  }

  static const String getComment = r'''
  query GetComment(
    $getCommentInput: GetCommentInput!
    $reactionType: ReactionType!
    $paginationInput: PaginationInput!
  ) {
    getComment(input: $getCommentInput) {
      ... on GetCommentResult {
        __typename
        comment {
          __typename
          id
          commentContext {
            __typename
            liked
          }
          commentStats {
            __typename
            likeCount
          }
          reactionsConnection(reactionType: $reactionType, paginationInput:$paginationInput) {
            __typename
            edges {
              __typename
              node {
                __typename
                id
                handle
                name
                avatarImage {
                  __typename
                  uri
                }
                currentUserContext {
                  __typename
                  followingUser
                }
              }
              cursor
            }
          }
        }
      }
    }
  }
  ''';
}
