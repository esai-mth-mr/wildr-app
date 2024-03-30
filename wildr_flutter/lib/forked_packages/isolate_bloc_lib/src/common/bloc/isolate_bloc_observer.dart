// ignore_for_file: lines_longer_than_80_chars

import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/change.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_base.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_cubit.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/transition.dart';

/// An interface for observing the behavior of [IsolateBloc] and [IsolateCubit] instances.
abstract class IsolateBlocObserver {
  /// Called whenever a [IsolateBlocBase] is instantiated.
  /// In many cases, a bloc may be lazily instantiated and
  /// [onCreate] can be used to observe exactly when the bloc
  /// instance is created.
  @protected
  @mustCallSuper
  void onCreate(IsolateBlocBase bloc);

  /// Called whenever an [event] is `added` to any [bloc] with the given [bloc]
  /// and [event].
  @protected
  @mustCallSuper
  void onEvent(IsolateBlocBase bloc, Object? event);

  /// Called whenever a [Change] occurs in any [bloc]
  /// A [change] occurs when a new state is emitted.
  /// [onChange] is called before a bloc's state has been updated.
  @protected
  @mustCallSuper
  void onChange(IsolateBlocBase bloc, Change change);

  /// Called whenever a transition occurs in any [bloc] with the given [bloc]
  /// and [transition].
  /// A [transition] occurs when a new `event` is `added` and `mapEventToState`
  /// executed.
  /// [onTransition] is called before a [bloc]'s state has been updated.
  @protected
  @mustCallSuper
  void onTransition(IsolateBloc bloc, Transition transition);

  /// Called whenever an [error] is thrown in any [IsolateBloc] or [IsolateCubit].
  /// The [stackTrace] argument may be [StackTrace.empty] if an error
  /// was received without a stack trace.
  @protected
  @mustCallSuper
  void onError(IsolateBlocBase bloc, Object error, StackTrace stackTrace);

  /// Called whenever a [IsolateBlocBase] is closed.
  /// [onClose] is called just before the bloc is closed
  /// and indicates that the particular instance will no longer
  /// emit new states.
  @protected
  @mustCallSuper
  void onClose(IsolateBlocBase bloc);
}
