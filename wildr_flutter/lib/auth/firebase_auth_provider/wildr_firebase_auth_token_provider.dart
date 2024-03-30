import 'dart:async';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:retry/retry.dart';
import 'package:wildr_flutter/analytics/analytics_common.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/wildr_firebase_auth_token_provider_callbacks.dart';
import 'package:wildr_flutter/constants/constants.dart';


class _TokenNullException implements Exception {}

class _TerminateTokenRetriesException implements Exception {
  final String code;

  _TerminateTokenRetriesException({required this.code});
}

const String kUninitializedTokenValue = 'uninitialized-token-value';

void print(dynamic message) {
  debugPrint('[WildrFirebaseAuthTokenProvider]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ WildrFirebaseAuthTokenProvider: $message');
}

/// @note To be initialized only during AppStartup
/// @role Retrieves auth tokens from FirebaseAuth.
class WildrFirebaseAuthTokenProvider {
  static WildrFirebaseAuthTokenProvider? _instance;

  factory WildrFirebaseAuthTokenProvider() {
    if (_instance != null) {
      throw Exception(
          'WildrFirebaseAuthTokenProvider seems to be injected in WildrAuth. '
          'Do not use this class directly. Use WildrAuth instead. '
          'If the function you are looking for is not present, '
          'feel free to write a wrapper.');
    }
    _instance ??= WildrFirebaseAuthTokenProvider._();
    return _instance!;
  }

  WildrFirebaseAuthTokenProvider._();

  String? _token = kUninitializedTokenValue;

  Future<String>? _getIdTokenFuture;
  Future<String?>? _refreshTokenFuture;

  bool _tokenRetrievalFailedPreviously = false;

  /// @note To be called only from [WildrAuth]
  /// @parameters [caller] Is used for debugging, pass it in the form 'aaaa'
  /// Makes a call to [_getIdToken] and updates [_token] of the instance
  Future<void> refreshTokenWhenLoggedIn({
    bool forceRefresh = false,
    String? caller, // used for debug purposes
    RefreshTokenCallbacks? cb,
  }) async {
    _refreshTokenFuture ??= getToken(
      caller: caller,
      forceRefresh: forceRefresh,
      cb: TokenRetrievalCallbacks(
        disableGQLEvents: (e, retryCount) =>
            cb?.disableGQLEvents?.call(e, retryCount),
        enableGQLEvents: () => cb?.enableGQLEvents?.call(),
        onTokenTakingLongerToRetrieve: () =>
            cb?.onTokenTakingLongerToRetrieve?.call(),
        onNetworkUnstable: () => cb?.onNetworkUnstable?.call(),
        onUserUnavailable: () => cb?.onUserUnavailable?.call(),
      ),
      onTokenChanged: (token) => cb?.onTokenChanged?.call(token),
    );
    print('$caller ${_refreshTokenFuture?.hashCode}');
    await _refreshTokenFuture?.then((value) => _refreshTokenFuture = null);
    return;
  }

  /// @note To be called only from [WildrAuth]
  /// Updates the [_token] of the instance
  /// @parameters [caller] Is used for debugging, pass it in the form 'aaaa'
  Future<String?> getToken({
    bool forceRefresh = false,
    String? caller, // used for debug purposes
    TokenRetrievalCallbacks? cb,
    Function(String?)? onTokenChanged,
  }) async {
    final currentUser = FirebaseAuth.instance.currentUser;
    final String? existingToken = _token;
    if (currentUser == null) {
      print('Current user is null');
      _token = null;
      if (existingToken != _token) onTokenChanged?.call(_token);
      return _token;
    }
    _token = await _getIdToken(
      currentUser,
      forceRefresh: forceRefresh,
      caller: caller,
      cb: cb,
    );
    if (_token != null && _isTokenExpiringSoon(_token!)) {
      _token = await _getIdToken(
        currentUser,
        forceRefresh: true,
        caller: caller,
        cb: cb,
      );
    }
    if (existingToken != _token) {
      print('onTokenChanged $caller');
      onTokenChanged?.call(_token);
    }
    return _token;
  }

  /// Returns a token with [RetryOptions]
  Future<String?> _getIdToken(
    User currentUser, {
    bool forceRefresh = false,
    String? caller,
    TokenRetrievalCallbacks? cb,
  }) async {
    const retryOptions = RetryOptions(
      delayFactor: kGetTokenRetryDelayDuration,
      maxAttempts: kTokenMaxRetryAttempts,
    );
    int retryCount = 0;
    try {
      _getIdTokenFuture ??= retryOptions.retry(
        () async {
          final Completer tokenCompleter = Completer();
          Timer? timer;
          timer = Timer(const Duration(seconds: 15), () {
            if (!tokenCompleter.isCompleted) {
              print('getIdToken took more than 15 seconds $caller');
              cb?.onTokenTakingLongerToRetrieve?.call();
            }
          });
          try {
            if (forceRefresh) {
              await FirebaseAnalytics.instance.logEvent(
                name: DebugGetIdTokenEvents.kIsForceRefresh,
                parameters: {
                  AnalyticsParameters.kRetryCount: retryCount,
                  AnalyticsParameters.kDebugGetIdTokenCaller: caller ?? 'N/A',
                },
              );
            }
            print('Trying to get token... $caller');
            // throw _TerminateTokenRetriesException(code: '21');
            // final token = await currentUser.getIdToken(forceRefresh);
            final token = await currentUser.getIdToken(true);
            print('Got the token');
            if (token == null) throw _TokenNullException();
            if (_tokenRetrievalFailedPreviously) {
              _tokenRetrievalFailedPreviously = false;
              cb?.enableGQLEvents?.call();
            }
            return token;
          } on FirebaseAuthException catch (e) {
            await _onFirebaseAuthException(e, cb, caller, retryCount);
            rethrow;
          } on PlatformException catch (e) {
            await _onPlatformException(e, caller, retryCount);
            rethrow;
          } on _TokenNullException catch (e) {
            await _onTokenNullException(e, caller, retryCount);
            rethrow;
          } catch (e, stacktrace) {
            if (e is _TerminateTokenRetriesException) {
              rethrow;
            }
            _logUnhandledException(
              e,
              stacktrace,
              willRetry: true,
              caller: caller,
            );
            throw _TokenNullException(); // unknown exception
          } finally {
            timer.cancel();
            tokenCompleter.complete();
          }
        },
        retryIf: (e) =>
            e is FirebaseAuthException ||
            e is PlatformException ||
            e is _TokenNullException,
        onRetry: (e) async {
          await _onRetry(e, cb, caller, ++retryCount);
        },
      );
      final token = await _getIdTokenFuture?.then((token) {
        _getIdTokenFuture = null;
        return token;
      });
      return token;
    } catch (e, stacktrace) {
      _logUnhandledException(e, stacktrace, caller: caller);
      _getIdTokenFuture = null;
      return null;
    }
  }

  Future<void> _onFirebaseAuthException(
    e,
    TokenRetrievalCallbacks? cb,
    String? caller,
    retryCount,
  ) async {
    printE('FirebaseAuthException caller: $caller $e $retryCount');
    switch (e.code) {
      case 'no-current-user':
      case 'no-such-provider':
        cb?.onUserUnavailable?.call();
        _tokenRetrievalFailedPreviously = true;
        throw _TerminateTokenRetriesException(code: e.code);
      case 'network-request-failed':
        cb?.onNetworkUnstable?.call();
    }
    await FirebaseAnalytics.instance.logEvent(
      name: DebugGetIdTokenEvents.kFirebaseAuthException,
      parameters: {
        AnalyticsParameters.kRetryCount: retryCount,
        AnalyticsParameters.kDebugGetIdTokenCaller: caller ?? kNA,
        AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
      },
    );
  }

  Future<void> _onPlatformException(e, String? caller, retryCount) async {
    printE('PlatformException $e $caller');
    await FirebaseAnalytics.instance.logEvent(
      name: DebugGetIdTokenEvents.kPlatformException,
      parameters: {
        AnalyticsParameters.kRetryCount: retryCount,
        AnalyticsParameters.kDebugGetIdTokenCaller: caller ?? kNA,
        AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
      },
    );
  }

  Future<void> _onTokenNullException(e, String? caller, retryCount) async {
    printE('Token null exception $caller');
    await FirebaseAnalytics.instance.logEvent(
      name: DebugGetIdTokenEvents.kTokenNullException,
      parameters: {
        AnalyticsParameters.kRetryCount: retryCount,
        AnalyticsParameters.kDebugGetIdTokenCaller: caller ?? kNA,
        AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
      },
    );
  }

  Future<void> _onRetry(
    e,
    TokenRetrievalCallbacks? cb,
    String? caller,
    retryCount,
  ) async {
    print('On Retry $e');
    await FirebaseAnalytics.instance.logEvent(
      name: DebugGetIdTokenEvents.kJwtTokenRetry,
      parameters: {
        AnalyticsParameters.kRetryCount: retryCount,
        AnalyticsParameters.kDebugGetIdTokenCaller: caller ?? kNA,
        AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
      },
    );
    _tokenRetrievalFailedPreviously = true;
    print('disableGQLEvents $caller');
    cb?.disableGQLEvents?.call(e, retryCount);
    print('retrying... $retryCount');
  }

  bool _isTokenExpiringSoon(String token) {
    final int diff = JwtDecoder.getExpirationDate(token)
        .difference(DateTime.now())
        .inMinutes;
    return diff < 5;
  }

  void _logUnhandledException(
    e,
    stacktrace, {
    bool willRetry = false,
    String? caller,
  }) {
    print('logUnhandledException $caller $e');
    FirebaseCrashlytics.instance.recordError(
      e,
      stacktrace,
      reason: 'WildrFirebaseAuth _logUnhandledException',
      information: [
        {'willRetry': willRetry},
        {'caller': caller ?? kNA},
      ],
    );
    FirebaseAnalytics.instance.logEvent(
      name: DebugEvents.kDebugGetFirebaseTokenUnhandledException,
      parameters: {
        AnalyticsParameters.kExceptionName: e.runtimeType.toString(),
        AnalyticsParameters.kWillRetry: willRetry.toString(),
        AnalyticsParameters.kCaller: caller ?? kNA,
        AnalyticsParameters.kDebugStackTrace: trimStackTrace(e.toString()),
      },
    );
  }
}
