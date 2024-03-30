// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/update_user_details_ext/update_user_details_state.dart';
import 'package:wildr_flutter/gql_services/g_mutations.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';

void print(dynamic message) {
  debugPrint('[UpdateUserDetailsGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [UpdateUserDetailsGqlIsolateBlocExt]: $message');
}

extension UpdateUserDetailsGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> updateUserEmail(UpdateUserEmailEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kUpdateEmail,
      variables: {
        'input': {'email': event.updatedEmail},
      },
    );
    emit(
      UpdateUserEmailState(
        checkResultRefreshCurrentUserReturnErrorMessage(
          event,
          result,
        ),
      ),
    );
  }

  Future<void> updateUserName(UpdateUserNameEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kUpdateName,
      variables: {
        'input': {'name': event.name},
      },
    );
    emit(
      UpdateUserNameState(
        checkResultRefreshCurrentUserReturnErrorMessage(
          event,
          result,
        ),
      ),
    );
  }

  Future<void> updateUserHandle(UpdateUserHandleEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kUpdateHandle,
      variables: {
        'input': {'handle': event.handle},
      },
    );
    debugPrint('here');
    emit(
      UpdateUserHandleState(
        checkResultRefreshCurrentUserReturnErrorMessage(
          event,
          result,
        ),
      ),
    );
  }

  Future<void> updateUserPhoneNumber(UpdateUserPhoneNumberEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kUpdatePhoneNumber,
      variables: {
        'input': {'phoneNumber': event.phoneNumber},
      },
    );
    emit(
      UpdateUserEmailState(
        checkResultRefreshCurrentUserReturnErrorMessage(
          event,
          result,
        ),
      ),
    );
  }

  Future<void> updateUserPronoun(UpdateUserPronounEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kUpdatePronoun,
      variables: {
        'input': {'pronoun': event.pronoun},
      },
    );
    emit(
      UpdateUserPronounState(
        checkResultRefreshCurrentUserReturnErrorMessage(
          event,
          result,
        ),
      ),
    );
  }

  Future<void> updateUserBio(UpdateUserBioEvent event) async {
    final QueryResult result = await gService.performMutationWith(
      MutationOperations.kUpdateBio,
      variables: {
        'input': {'bio': event.bio},
      },
    );
    emit(
      UpdateBioState(
        checkResultRefreshCurrentUserReturnErrorMessage(
          event,
          result,
        ),
      ),
    );
  }

  Future<void> updateUserAvatar(UpdateUserAvatarEvent event) async {
    QueryResult result;
    if (event.avatar == null) {
      result = await gService.performMutationWith(
        MutationOperations.kRemoveAvatar,
        variables: {'shouldRemove': true},
      );
    } else {
      final avatarByteData = event.avatar!.materialize().asUint8List();
      final imageFile = http.MultipartFile.fromBytes(
        'image',
        avatarByteData,
        filename: '${DateTime.now().second}.webp',
        contentType: http_parser.MediaType('image', 'webp'),
      );
      result = await gService.performMutationWith(
        MutationOperations.kUpdateAvatar,
        variables: {
          'input': {'image': imageFile},
        },
      );
    }
    emit(
      UpdateUserAvatarImageState(
        checkResultRefreshCurrentUserReturnErrorMessage(
          event,
          result,
        ),
      ),
    );
  }

  Future<void> userRequestedDelete(
    RequestDeleteEvent event,
  ) async {
    final QueryResult result = await gService.performMutation(
      GQMutations.kRequestDeleteUser,
      variables: {'requestDelete': true},
      operationName: 'requestDeleteUser',
    );
    debugPrint(result.toString());
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage != null) {
      emit(RequestDeleteUserState(errorMessage: errorMessage));
    } else {
      emit(
        RequestDeleteUserState(),
      );
    }
  }
}
