import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';

class ExploreFeedGqlQueries {
  final String kExploreFeed = r'''
    query exploreFeed(
      $getFeedInput: GetFeedInput!
      $first: Int
      $after: String
      $last: Int
      $before: String
    ) {
      getFeed(input: $getFeedInput) {
        __typename
        ...PaginatedFeedOutput
      }
    }
  ''';

  String exploreFeed() => CreateQuery.createQuery(kExploreFeed, [
        GFragments.kPostStatsFragment,
        GFragments.kTimestampFragment,
        GFragments.kTagFragment,
        GFragments.kUserFragmentGetFeed,
        GFragments.kCommentFragment,
        GFragments.kContentFragment,
        GFragments.kTextPostFragment,
        GFragments.kMultiMediaPostFragment,
        GFragments.kImageFragment,
        GFragments.kImagePostFragment,
        GFragments.kMediaSourceFragment,
        GFragments.kVideoFragment,
        GFragments.kVideoPostFragment,
        GFragments.kPostContextFragment,
        GFragments.kPageInfoFragment,
        GFragments.kFeedPostsEdgeFragment,
        GFragments.kPaginatedFeedFragment,
        GFragments.kPaginatedFeedOutput,
      ]);
}
