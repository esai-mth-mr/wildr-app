import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';

class ReplyGqlQueries {
  static const String getReply = r'''
  query GetReply(
    $getReplyInput: GetReplyInput!
    $reactionType: ReactionType!
    $paginationInput: PaginationInput!
  ) {
    getReply(input: $getReplyInput) {
      ... on GetReplyResult {
        __typename
        reply {
          __typename
          id
          replyContext {
            __typename
            liked
          }
          replyStats {
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

  String get paginateReplies {
    const String query = r'''
query paginatedReplies(
  $commentId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
  $includingAndAfter: String
  $includingAndBefore: String
  $targetReplyId: ID
) {
  getComment(input: { id: $commentId }) {
    ... on GetCommentResult {
      __typename
      comment {
        __typename
        id
        ts {
          __typename
          ...TimestampFragment
        }
        author {
          __typename
          id
          score
          isSuspended
          handle
          name
          avatarImage {
            __typename
            uri
          }
          strikeData {
            __typename
            isFaded
            currentStrikeCount
          }
        }
        body {
          __typename
          ...ContentFragment
        }
        participationType
        commentStats {
          __typename
          likeCount
        }
        commentContext {
          __typename
          liked
        }
        repliesConnection(
          commentId: $commentId
          first: $first
          after: $after
          last: $last
          before: $before
          includingAndAfter: $includingAndAfter
          includingAndBefore: $includingAndBefore
          targetReplyId: $targetReplyId
        ) {
          pageInfo {
            __typename
            ...PageInfoFragment
          }
          targetReplyError
          edges {
            __typename
            cursor
            node {
              __typename
              id
              ts {
                __typename
                createdAt
                updatedAt
              }
              author {
                __typename
                id
                score
                isSuspended
                handle
                name
                avatarImage {
                  __typename
                  uri
                }
                strikeData {
                  __typename
                  isFaded
                  currentStrikeCount
                }
              }
              body {
                __typename
                ...ContentFragment
              }
              replyStats {
                __typename
                likeCount
              }
              replyContext {
                __typename
                liked
              }
            }
          }
        }
      }
    }
  }
} 
    ''';

    return CreateQuery.createQuery(query, [
      GFragments.kPageInfoFragment,
      GFragments.kTimestampFragment,
      GFragments.kContentFragment,
    ]);
  }
}
