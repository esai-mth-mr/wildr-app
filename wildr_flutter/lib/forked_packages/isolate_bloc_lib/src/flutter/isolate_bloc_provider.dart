// ignore_for_file: lines_longer_than_80_chars, cascade_invocations

import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/api_wrappers.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_base.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_wrapper.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/flutter/bloc_info_holder.dart';

/// A function that creates a `Bloc` of type [T].
typedef CreateIsolateBloc<T extends IsolateBlocBase<Object?, Object?>> = T
    Function(
  BuildContext context,
);

/// {@template bloc_provider}
/// Takes a `ValueBuilder` that is responsible for creating the `bloc` and
/// a [child] which will have access to the `bloc` via
/// `IsolateBlocProvider.of(context)`.
/// It is used as a dependency injection (DI) widget so that a single instance
/// of a `bloc` can be provided to multiple widgets within a subtree.
///
/// Automatically handles closing the `bloc` when used with `create`.
///
/// ```dart
/// IsolateBlocProvider(
///   create: (BuildContext context) => BlocA(),
///   child: ChildA(),
/// );
/// ```
/// {@endtemplate}
class IsolateBlocProvider<T extends IsolateBlocBase<Object?, State>, State>
    extends SingleChildStatelessWidget
    with IsolateBlocProviderSingleChildWidget {
  /// {@macro bloc_provider}
  IsolateBlocProvider({
    super.key,
    this.child,
    this.lazy,
  })  : _value = null,
        super(child: child);

  /// Takes a `bloc` and a [child] which will have access to the `bloc` via
  /// `IsolateBlocProvider.of(context)`.
  /// When `IsolateBlocProvider.value` is used, the `bloc` will not be automatically
  /// closed.
  /// As a result, `IsolateBlocProvider.value` should mainly be used for providing
  /// existing `bloc`s to new routes.
  ///
  /// A new `bloc` should not be created in `IsolateBlocProvider.value`.
  /// `bloc`s should always be created using the default constructor within
  /// `create`.
  ///
  /// ```dart
  /// IsolateBlocProvider.value(
  ///   value: IsolateBlocProvider.of<BlocA, BlocAState>(context),
  ///   child: ScreenA(),
  /// );
  /// ```
  IsolateBlocProvider.value({
    super.key,
    required WildrGqlIsolateBlocWrapper<Object?> value,
    this.child,
  })  : _value = value,
        lazy = null,
        super(child: child);

  /// [child] and its descendants which will have access to the `bloc`.
  final Widget? child;

  /// Whether the [Bloc] or [Cubit] should be created lazily.
  /// Defaults to `true`.
  final bool? lazy;

  final WildrGqlIsolateBlocWrapper<Object?>? _value;

  /// Method that allows widgets to access a `cubit` instance as long as their
  /// `BuildContext` contains a [IsolateBlocProvider] instance.
  ///
  /// If we want to access an instance of `BlocA` which was provided higher up
  /// in the widget tree we can do so via:
  ///
  /// ```dart
  /// IsolateBlocProvider.of<BlocA, BlocAState>(context)
  /// ```
  static WildrGqlIsolateBlocWrapper<State>
      of<T extends IsolateBlocBase<Object?, State>, State>(
    BuildContext context,
  ) {
    final blocInfoHolder = _getBlocInfoHolder(context);
    final blocWrapper = blocInfoHolder?.getWrapperByType<T, State>();
    if (blocWrapper == null) {
      throw FlutterError(
        '''
        IsolateBlocProvider.of() called with a context that does not contain a IsolateBlocWrapper for $T.
        No ancestor could be found starting from the context that was passed to IsolateBlocProvider.of<$T>().

        This can happen if you doesn't specify generic type or the context you used comes from a widget above the IsolateBlocProvider.

        The context used was: $context
        ''',
      );
    }

    return blocWrapper;
  }

  @override
  Widget buildWithChild(BuildContext context, Widget? child) {
    final value = _value;
    if (value != null) {
      return InheritedProvider.value(
        value: () {
          final blocInfoHolder =
              _getBlocInfoHolder(context) ?? BlocInfoHolder();
          blocInfoHolder.addBlocInfo<T>(value);

          return blocInfoHolder;
        }(),
        child: child,
      );
    } else {
      return InheritedProvider<BlocInfoHolder>(
        create: (context) {
          final blocWrapper = createIsolateBloc<T, State>();
          final blocInfoHolder =
              _getBlocInfoHolder(context) ?? BlocInfoHolder();
          blocInfoHolder.addBlocInfo<T>(blocWrapper);

          return blocInfoHolder;
        },
        dispose: (context, infoHolder) {
          final blocWrapper = infoHolder.removeBloc<T>();
          assert(blocWrapper != null, '`blocWrapper` expected to not nullable');
          blocWrapper?.close();
        },
        lazy: lazy,
        child: child,
      );
    }
  }

  static BlocInfoHolder? _getBlocInfoHolder(BuildContext context) {
    try {
      return Provider.of<BlocInfoHolder>(context, listen: false);
    } catch (_) {
      return null;
    }
  }
}

/// Extends the `BuildContext` class with the ability
/// to perform a lookup based on a `IsolateBlocBase` type.
extension IsolateBlocProviderExtension on BuildContext {
  /// Performs a lookup using the `BuildContext` to obtain
  /// the nearest ancestor `Cubit` of type [C].
  ///
  /// Calling this method is equivalent to calling:
  ///
  /// ```dart
  /// IsolateBlocProvider.of<C>(context)
  /// ```
  WildrGqlIsolateBlocWrapper<State>
      isolateBloc<C extends IsolateBlocBase<Object?, State>, State>() =>
          IsolateBlocProvider.of<C, State>(this);
}

/// Mixin which allows `MultiBlocProvider` to infer the types
/// of multiple [IsolateBlocProvider]s.
mixin IsolateBlocProviderSingleChildWidget on SingleChildWidget {}
