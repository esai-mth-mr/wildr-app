import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';

class HomeFeedQueries {
  static String initialFeedQuery() =>
      CreateQuery.createQuery(GQueries.kPaginateFeedQuery, [
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
