import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/isolate_bloc.dart';

/// Class for isolate events.
@immutable
abstract class IsolateEvent extends Equatable {
  const IsolateEvent();
}

/// Events for communication between [UIIsolateManager] and [IsolateManager].
@immutable
abstract class IsolateBlocEvent extends IsolateEvent {
  const IsolateBlocEvent();
}
