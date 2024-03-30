import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/change.dart';

/// {@template transition}
/// Occurs when an [event] is `added` after `onEventReceived` has been called
/// but before the bloc's [State] has been updated.
/// A [Transition] consists of the [currentState], the [event] which was
/// `added`, and the [nextState].
/// {@endtemplate}
@immutable
class Transition<Event, State> extends Change<State> {
  /// {@macro transition}
  const Transition({
    required super.currentState,
    required this.event,
    required super.nextState,
  });

  /// The [Event] which triggered the current [Transition].
  final Event event;

  @override
  int get hashCode =>
      currentState.hashCode ^ event.hashCode ^ nextState.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Transition<Event, State> &&
          runtimeType == other.runtimeType &&
          currentState == other.currentState &&
          event == other.event &&
          nextState == other.nextState;

  @override
  String toString() => 'Transition { currentState: $currentState, '
      'event: $event, nextState: $nextState }';
}
