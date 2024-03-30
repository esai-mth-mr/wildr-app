// ignore: lines_longer_than_80_chars
// ignore_for_file: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member

import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/bloc/ext_parse_smart_error.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/login_signup_ext/login_signup_state.dart';
import 'package:wildr_flutter/gql_services/g_queries.dart';
import 'package:wildr_flutter/gql_services/g_variables.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';
import 'package:wildr_flutter/gql_services/query_operations.dart';
import 'package:wildr_flutter/home/model/wildr_user_with_token.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';

void print(dynamic message) {
  debugPrint('[LoginSignupGqlIsolateBlocExt]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [LoginSignupGqlIsolateBlocExt]: $message');
}

extension LoginSignupGqlIsolateBlocExt on GraphqlIsolateBloc {
  Future<void> loginViaFirebaseEmail(FirebaseEmailAuthEvent event) async {
    final QueryResult res = await gService.performMutationWith(
      MutationOperations.kFirebaseEmailAuthentication,
      variables: event.getInput(),
      shouldPrintLog: true,
    );
    getErrorMessageFromResultAndLogEvent(event, res);
    _handleLoginOutput(
      res: res,
      eventName: event.runtimeType.toString(),
      operationName: MutationOperations.kFirebaseEmailAuthentication,
    );
  }

  Future<void> loginViaFirebasePhoneNumber(
    FirebaseLoginWithPhoneNumberEvent event,
  ) async {
    final String operationName =
        MutationOperations.kFirebasePhoneNumberAuthentication;
    final QueryResult res = await gService.performMutationWith(
      operationName,
      variables: event.getInput(),
    );
    getErrorMessageFromResultAndLogEvent(event, res);
    _handleLoginOutput(
      res: res,
      eventName: event.runtimeType.toString(),
      operationName: operationName,
    );
  }

  Future<void> performDebugLogin(PerformDebugLoginEvent event) async {
    print('performing debug login');
    final QueryResult res = await gService.performMutationWith(
      MutationOperations.kLogin,
      variables: {
        GQVariables.kUsernameLogin: event.email,
        GQVariables.kPassword: event.password,
      },
    );
    getErrorMessageFromResultAndLogEvent(event, res);
    _handleLoginOutput(
      res: res,
      eventName: event.runtimeType.toString(),
      isDebug: true,
    );
  }

  Future<void> getOrDeleteFirebaseUser(
    GetOrDeleteFirebaseUserEvent event,
  ) async {
    final String operationName = MutationOperations.kGetOrDeleteFirebaseUser;
    final QueryResult result = await gService.performMutationWith(
      operationName,
      variables: {'uid': event.uid},
    );
    String? errorMessage = getErrorMessageFromResultAndLogEvent(event, result);
    if (result.hasException) {
      printE('[GetOrDeleteFirebaseUSerVent] ${result.exception}');
    } else if (result.data != null) {
      if (result.data![operationName] != null) {
        if (result.data![operationName]['user'] != null) {
          await _handleSignupOutput(
            res: result,
            operationName: operationName,
          );
          return;
        } else {
          if (result.data![operationName]['isSuccessful'] == true) {
            emit(RemovePrefKeyState(PrefKeys.kPendingSignup));
            errorMessage = null;
          }
        }
      }
    }
    emit(
      DeleteFirebaseUserState(
        isSuccessful: errorMessage == null,
        errorMessage: errorMessage,
      ),
    );
  }

  void _handleLoginOutput({
    required QueryResult res,
    required String eventName,
    String operationName = 'login',
    bool isDebug = false,
  }) {
    debugPrint('Handle Login Output');
    debugPrint('$res');
    if (res.data != null) {
      final String? errorMessage = res.smartErrorMessage();
      final String? askForHandleAndNameError =
          res.askForHandleAndNameErrorMessage();
      if (errorMessage != null) {
        emit(LoginSignupFailedState(errorMessage));
      } else if (askForHandleAndNameError != null) {
        emit(AskForHandleAndNameState(askForHandleAndNameError));
      } else if (errorMessage == null) {
        final WildrUserWithToken user =
            WildrUserWithToken.fromData(res.data!, operationName);
        currentUser = user.user;
        emit(GqlIsolateLoginSuccessfulState(user));
      } else {
        emit(LoginSignupFailedState(kSomethingWentWrong));
      }
    } else if (res.exception != null &&
        res.exception!.graphqlErrors.isNotEmpty) {
      debugPrint('HERE ${res.exception}');
      final error = res.exception!.graphqlErrors[0];
      if (error.message == 'Unauthorized') {
        emit(LoginSignupFailedState('Invalid username or password'));
      } else {
        _emitLoginSignupSomethingWentWrong();
      }
    } else {
      _emitLoginSignupSomethingWentWrong();
    }
  }

  Future<void> _handleSignupOutput({
    required QueryResult res,
    String operationName = 'signUpWithEmail',
  }) async {
    if (res.data != null) {
      final String? handleAlreadyTakenError =
          res.handleAlreadyTakenErrorMessage();
      if (handleAlreadyTakenError != null) {
        emit(HandleAlreadyTakenState(handleAlreadyTakenError));
        return;
      }
      final String? errorMessage = res.smartErrorMessage();
      if (errorMessage == null) {
        final data = res.data!;
        debugPrint('SIGNUP RESPONSE DATA $data');
        final WildrUserWithToken user =
            WildrUserWithToken.fromData(data, operationName);
        emit(GqlIsolateSignupSuccessfulState(user));
        return;
      }
      emit(LoginSignupFailedState(errorMessage));
      return;
    } else if (res.exception != null &&
        res.exception!.graphqlErrors.isNotEmpty) {
      final error = res.exception!.graphqlErrors[0];
      final extensions = error.extensions;
      printE(error.message);
      if (extensions != null) {
        print('Extensions != null');
        if (extensions.containsKey('code')) {
          emit(LoginSignupFailedState('Oops! Something went wrong.'));
          return;
        }
      }
    }
    _emitLoginSignupSomethingWentWrong();
  }

  Future<void> performFirebaseSignup(
    FirebaseSignupEvent event,
  ) async {
    final QueryResult res = await gService.performMutationWith(
      MutationOperations.kFirebaseSignup,
      variables: await event.getInput(),
      shouldPrintLog: true,
    );
    debugPrint(res.toString());
    getErrorMessageFromResultAndLogEvent(event, res);
    await _handleSignupOutput(
      res: res,
      operationName: MutationOperations.kFirebaseSignup,
    );
  }

  Future<void> checkPhoneNumberAccountExists(
    CheckPhoneNumberAccountExistsEvent event,
  ) async {
    print(event.getVariables().toString());
    final QueryResult result = await gService.performQuery(
      event.query,
      operationName: QueryOperations.kCheckPhoneNumberUserExists,
      variables: event.getVariables(),
    );
    getErrorMessageFromResultAndLogEvent(event, result);
    if (result.hasException) {
      final exception = result.exception!;
      printE('[CheckPhoneNumberAccount] $exception');
      emit(CheckPhoneNumberAccountFailedState());
    } else if (result.data != null) {
      emit(
        CheckPhoneNumberAccountExistsState(
          phoneNumberAccountExist:
              result.data![QueryOperations.kCheckPhoneNumberUserExists]
                      ?['phoneNumberAccountExist'] ??
                  false,
        ),
      );
    }
  }

  Future<void> checkHandle(CheckHandleEvent event) async {
    final QueryResult result = await gService.performQuery(
      GQueries.kCheckHandle,
      variables: event.getVariable(),
      operationName: 'checkHandle',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      final bool doesExist = data['checkHandle']['doesExist'] ?? false;
      debugPrint(doesExist.toString());
      emit(CheckHandleResultState(doesExist: doesExist));
    } else {
      emit(CheckHandleResultState(errorMessage: errorMessage));
    }
  }

  Future<void> check3rdParty(Check3rdPartyEvent event) async {
    final QueryResult result = await gService.performQuery(
      GQueries.kCheck3rdParty,
      variables: event.getVariable(),
      operationName: 'check3rdParty',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      final bool doesExist = data['check3rdParty']['doesExist'] ?? false;
      emit(Check3rdPartyResult(doesExist: doesExist));
    } else {
      emit(Check3rdPartyResult(errorMessage: errorMessage));
    }
  }

  Future<void> getDetailsFrom3rdPartyUid(
    GetDetailsFrom3rdPartyUidEvent event,
  ) async {
    final QueryResult result = await gService.performQuery(
      GQueries.kGetDetailsFrom3rdPartyUid,
      variables: event.getVariable(),
      operationName: 'getDetailsFrom3rdPartyUid',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      final String email = data['getDetailsFrom3rdPartyUid']['email'];
      final String? name = data['getDetailsFrom3rdPartyUid']['name'];
      emit(GetDetailsFrom3rdPartyUidResult(email: email, name: name));
    } else {
      emit(GetDetailsFrom3rdPartyUidResult(errorMessage: errorMessage));
    }
  }

  Future<void> checkEmail(CheckEmailEvent event) async {
    final QueryResult result = await gService.performQuery(
      GQueries.kCheckEmail,
      variables: event.getVariable(),
      shouldPrintLog: true,
      operationName: 'checkEmail',
    );
    final String? errorMessage =
        getErrorMessageFromResultAndLogEvent(event, result);
    if (errorMessage == null) {
      final Map<String, dynamic> data = result.data!;
      final bool doesExist = data['checkEmail']['doesExist'] ?? false;
      emit(CheckEmailResult(doesExist: doesExist));
    } else {
      emit(CheckEmailResult(errorMessage: errorMessage));
    }
  }

  void _emitLoginSignupSomethingWentWrong() {
    emit(LoginSignupFailedState(kSomethingWentWrong));
  }
}
