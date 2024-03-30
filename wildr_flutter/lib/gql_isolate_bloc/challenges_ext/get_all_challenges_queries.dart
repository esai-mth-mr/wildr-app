import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_query_fragments.dart';
import 'package:wildr_flutter/gql_services/create_query.dart';
import 'package:wildr_flutter/gql_services/g_fragments.dart';

class GetChallengesQueries {
  final String operationName = 'getChallenges';

  final String _getChallengesQuery = r'''
query getChallenges($input: GetChallengesInput!) {
  getChallenges(input: $input) {
    ... on GetChallengesResult {
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
          ...ChallengeFragment
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

  String get myChallengesQuery => CreateQuery.createQuery(_getChallengesQuery, [
        ChallengeFragments.kAuthor,
        ChallengeFragments.kChallenge,
        ChallengeFragments.kCover,
        ChallengeFragments.kTimeStamps,
        GFragments.kPageInfoFragment,
      ]);

  String get allChallengesQuery =>
      CreateQuery.createQuery(_getChallengesQuery, [
        ChallengeFragments.kAuthor,
        ChallengeFragments.kChallengeWithPreviewParticipants,
        ChallengeFragments.kCover,
        ChallengeFragments.kTimeStamps,
        GFragments.kPageInfoFragment,
      ]);

  String get featuredChallengesQuery =>
      CreateQuery.createQuery(_getChallengesQuery, [
        ChallengeFragments.kAuthor,
        ChallengeFragments.kChallengeWithPreviewParticipants,
        ChallengeFragments.kCover,
        ChallengeFragments.kTimeStamps,
        GFragments.kPageInfoFragment,
      ]);
}
