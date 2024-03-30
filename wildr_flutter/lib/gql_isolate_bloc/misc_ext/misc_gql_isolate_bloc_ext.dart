// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';

void print(dynamic message) {
  debugPrint('[MiscGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [MiscGqlIsolateBlocExt]: $message');
}

extension MiscGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> generateInviteCode(
    GenerateInviteCodeEvent event,
  ) async {
    if (currentUser == null) {
      emit(
        GenerateInviteCodeResultState(
          event,
          errorMessage: kSomethingWentWrong,
        ),
      );
      return;
    }
    final QueryResult result = await gService.performQuery(
      GQueries.getInviteCode(),
      variables: {
        'input': {
          'userId': currentUser!.id,
          'action': event.inviteCodeAction?.name,
        },
      },
      operationName: 'getInviteCode',
    );
    debugPrint(result.toString());
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage != null) {
      emit(GenerateInviteCodeResultState(event, errorMessage: errorMessage));
    } else if (result.data != null) {
      if (event.phoneNumber != null || event.userListType != null) {
        emit(
          GenerateInviteCodeResultState(
            event,
            inviteCode: result.data!['getInviteCode']['code'],
          ),
        );
      } else {
        emit(
          GenerateInviteCodeResultState(
            event,
            inviteCode: result.data!['getInviteCode']['code'],
          ),
        );
      }
    } else {
      emit(
        GenerateInviteCodeResultState(
          event,
          errorMessage: kSomethingWentWrong,
        ),
      );
    }
  }

  Future<void> checkInviteCode(
    CheckInviteCodeEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.checkAndRedeemInviteCode(),
      variables: {
        'input': {'code': event.code},
      },
      operationName: 'checkAndRedeemInviteCode',
    );
    debugPrint(result.toString());
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    String? payload;
    if (errorMessage == null && result.data != null) {
      payload = result.data!['checkAndRedeemInviteCode']?['payload'];
    }
    emit(CheckInviteCodeResultState(errorMessage, payload));
  }
}
