// ignore_for_file: prefer-match-file-name
import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_event.dart';

/// Event with [IsolateBloc]'s state or or with
/// event from [WildrGqlIsolateBlocWrapper].
@immutable
class IsolateBlocTransitionEvent extends IsolateBlocEvent {
  const IsolateBlocTransitionEvent(this.blocId, this.event);

  final String blocId;
  final Object? event;

  @override
  List<Object?> get props => [blocId, event];
}

/// Request to create new [IsolateBloc].
@immutable
class CreateIsolateBlocEvent extends IsolateBlocEvent {
  const CreateIsolateBlocEvent(this.blocType, this.blocId);

  final Type blocType;
  final String blocId;

  @override
  List<Object?> get props => [blocType, blocId];
}

/// Event to bind [WildrGqlIsolateBlocWrapper] to the
/// [IsolateBloc] when second one is created.
@immutable
class IsolateBlocCreatedEvent extends IsolateBlocEvent {
  const IsolateBlocCreatedEvent(this.blocId);

  final String blocId;

  @override
  List<Object?> get props => [blocId];
}

/// When every [IsolateBloc]s are initialized.
@immutable
class IsolateBlocsInitialized extends IsolateBlocEvent {
  const IsolateBlocsInitialized(this.initialStates);

  final InitialStates initialStates;

  @override
  List<Object?> get props => [initialStates];
}

/// Event to close IsolateBloc. Called by [WildrGqlIsolateBlocWrapper.close].
@immutable
class CloseIsolateBlocEvent extends IsolateBlocEvent {
  const CloseIsolateBlocEvent(this.blocId);

  final String blocId;

  @override
  List<Object?> get props => [blocId];
}
