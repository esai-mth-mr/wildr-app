// ignore_for_file: invalid_use_of_visible_for_testing_member,
// ignore_for_file: invalid_use_of_protected_member

import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/ext_parse_smart_error.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_state.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/banner.dart';

extension BannerGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> getBanners(GetBannersEvent event) async {
    print('GetBanners');

    final getBannersQuery = await gService.performQuery(
      GQueries.kGetBanners,
      operationName: QueryOperations.kGetBanners,
    );

    final errorMessage = getErrorMessageFromResultAndLogEvent(
      event,
      getBannersQuery,
    );
    if (errorMessage != null) {
      return;
    }

    if (getBannersQuery.data != null) {
      final getBannersData =
          getBannersQuery.data?['getBanners'] as Map<String, dynamic>?;
      if (getBannersData != null) {
        final bannersData = getBannersData['banners'] as List<dynamic>?;
        if (bannersData != null && bannersData.isNotEmpty) {
          final banner = BannerModel.fromJson(
            bannersData.first,
          );

          emit(
            CanShowBannerState(
              banner: banner,
            ),
          );
          return;
        }
      }
    }
    emit(CanShowBannerState());
    return;
  }

  Future<void> joinWildrCoinWaitlist(JoinWildrCoinWaitlist event) async {
    final result = await gService.performMutation(
      GQMutations.kAddUserToWildrCoinWaitlist,
      operationName: 'addUserToWaitlist',
      variables: {
        'input': {
          'waitlistType': 'WILDRCOIN',
        },
      },
      cacheRereadPolicy: CacheRereadPolicy.ignoreAll,
      fetchPolicy: FetchPolicy.noCache,
    );
    print(result);
    if (result.smartErrorMessage() case final errorMessage?) {
      emit(
        WildrCoinWaitlistSignedUpErrorState(errorMessage: errorMessage),
      );
      return;
    }
    emit(
      WildrCoinWaitlistSignedUpState(
        signedUpSuccessfully:
            result.data?['addUserToWaitlist']['success'] as bool,
      ),
    );
    return;
  }

  Future<void> ignoreBanner(IgnoreBannerEvent event) async {
    final result = await gService.performMutation(
      GQMutations.kSkipBanner,
      operationName: 'skipBanner',
      variables: {
        'input': {
          'bannerId': event.bannerId,
        },
      },
      cacheRereadPolicy: CacheRereadPolicy.ignoreAll,
      fetchPolicy: FetchPolicy.noCache,
    );
    print(result);
    return;
  }
}
