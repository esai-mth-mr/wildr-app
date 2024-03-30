// ignore_for_file: lines_longer_than_80_chars

import 'dart:async';
import 'dart:collection';

import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'package:wildr_flutter/auth/firebase_auth_provider/wildr_firebase_auth_token_provider_callbacks.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_bloc_events/isolate_bloc_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/main_common.dart';

/// Signature for event receiver function which takes an [IsolateBlocTransitionEvent]
/// and send this event to the [IsolateBloc]
typedef EventReceiver = void Function(Object? event);

/// Signature for function which takes [IsolateBloc]'s uuid and close it
typedef IsolateBlocKiller = void Function(String uuid);

/// Takes a `Stream` of `Events` as input
/// and transforms them into a `Stream` of `States` as output using [IsolateBlocBase].
///
/// It works like a client for [IsolateBlocBase]. It receives [IsolateBlocBase]'s
/// states and sends events added by `wrapperInstance.add(YourEvent())`. So you can
/// listen for origin bloc's state with `wrapperInstance.listen((state) { })` and add
/// events as shown above.
///
/// It may be created:
///   * by [createBloc] function which creates [IsolateBlocBase] in `Isolate`
///     and returns the instance of this class.
///   * by [getBloc] function which creates the instance of this class
///     and connects it to the [IsolateBlocBase]
///
/// Don't create this manually!
class WildrGqlIsolateBlocWrapper<State> {
  bool isUsingLocalJwtToken = false;
  late final WildrAuth _auth = WildrAuth();

  /// Takes initialState ([state]), function which receives events
  /// and sends them to the [IsolateBlocBase]
  /// and function which called on [close] and closes [IsolateBlocBase]
  /// which is connected to this wrapper.
  @protected
  WildrGqlIsolateBlocWrapper({
    State? state,
    required EventReceiver eventReceiver,
    required IsolateBlocKiller onBlocClose,
    String envName = 'PROD',
  })  : _eventReceiver = eventReceiver,
        _onBlocClose = onBlocClose,
        _state = state,
        isolateBlocId = isolateBlocIdGenerator() {
    _bindEventsListener();
    if (kDebugMode && envName == Environment.LOCAL.name) {
      isUsingLocalJwtToken = true;
    }
  }

  /// Creates wrapper for [getBloc] functionality
  @protected
  WildrGqlIsolateBlocWrapper.isolate(
    this._eventReceiver,
    this._onBlocClose, [
    State? state,
  ]) : _state = state {
    _bindEventsListener();
  }

  /// Id of IsolateBloc. It's needed to find bloc in isolate.
  ///
  /// This id may be changed.
  @protected
  String? isolateBlocId;

  final _eventController = StreamController<Object?>.broadcast();
  final _stateController = StreamController<State>.broadcast();

  State? _state;

  /// Used to sync unsent events.
  var _blocCreated = false;
  final _unsentEvents = Queue<Object?>();
  final IsolateBlocKiller _onBlocClose;
  bool _didDisableGQLEvents = false;
  late StreamSubscription<Object?> _eventReceiverSubscription;

  /// Callback which receives events and sends them to the IsolateBloc.
  final EventReceiver _eventReceiver;

  /// Returns the current [state] of the [bloc].
  ///
  /// It may be null only in wrapper provided by `getBlocWrapperFunction`.
  /// Can't be null in UI isolate.
  State? get state => _state;

  /// Returns the stream of states.
  Stream<State> get stream => _stateController.stream;

  /// Returns stream of `event`.
  Stream<Object?> get _eventStream => _eventController.stream;

  /// As a result, call original [IsolateBloc]'s add function.
  Future<void> add(Object? event) async {
    final eventName = event?.runtimeType.toString() ?? '';
    print(eventName);
    if (isUsingLocalJwtToken || !_auth.isLoggedIn) {
      if (_didDisableGQLEvents) {
        _didDisableGQLEvents = false;
        _eventController.add(EnableGQLEvents());
      }
      print('logged out | Adding event to stream $eventName');
      _eventController.add(event);
      return;
    }
    await _auth.refreshTokenWhenLoggedIn(
      caller: eventName,
      cb: RefreshTokenCallbacks(
        disableGQLEvents: (e, retryCount) {
          print('Firing EnableStuckOnTokenFetchEvent');
          _didDisableGQLEvents = true;
          _eventController.add(DisableGQLEvents());
        },
        enableGQLEvents: () {
          print('Firing DisableStuckOnTokenFetchEvent');
          _didDisableGQLEvents = false;
          _eventController.add(EnableGQLEvents());
        },
        onTokenTakingLongerToRetrieve: () =>
            _eventController.add(TokenRetrievalTakingLongerEvent()),
        onNetworkUnstable: () =>
            _eventController.add(TokenRetrievalTakingLongerEvent()),
        onUserUnavailable: () {
          _didDisableGQLEvents = true;
          _eventController
            ..add(DisableGQLEvents())
            ..add(LogoutOnTokenRetrievalFailedEvent());
        },
        onTokenChanged: (token) =>
            _eventController.add(RefreshFirebaseJwtToken(token)),
      ),
    );
    print('Adding event to stream $eventName');
    _eventController.add(event);
  }

  /// Closes the `event` stream and requests to close connected [IsolateBlocBase].
  @mustCallSuper
  Future<void> close() async {
    final id = isolateBlocId;
    if (id != null) {
      _onBlocClose(id);
    }
    await _eventController.close();
    await _stateController.close();
    await _eventReceiverSubscription.cancel();
  }

  /// Connects this wrapper to the [IsolateBlocBase] and sends all unsent events.
  // TODO(Maksim): Maybe move unsent events synchronization to the [IsolateManager]
  @protected
  void onBlocCreated() {
    _blocCreated = true;
    while (_unsentEvents.isNotEmpty) {
      _eventReceiver(_unsentEvents.removeFirst());
    }
  }

  /// Receives [IsolateBlocBase]'s states and adds them to the state Stream.
  @protected
  void stateReceiver(State nextState) {
    if (nextState != _state) {
      _stateController.add(nextState);
      _state = nextState;
    }
  }

  /// Starts listening for new `events`.
  void _bindEventsListener() {
    _eventReceiverSubscription = _eventStream.listen((event) {
      if (_blocCreated) {
        _eventReceiver(event);
      } else {
        _unsentEvents.add(event);
      }
    });
  }
}

/// Signature for [WildrGqlIsolateBlocWrapper] id generator.
typedef IdGenerator = String Function();

/// This function is used to generate id for [WildrGqlIsolateBlocWrapper].
///
/// By default uses `uuid v4` generator.
IdGenerator isolateBlocIdGenerator = const Uuid().v4;

void print(dynamic message) {
  debugPrint('[IsolateBlocWrapper]: $message');
}
