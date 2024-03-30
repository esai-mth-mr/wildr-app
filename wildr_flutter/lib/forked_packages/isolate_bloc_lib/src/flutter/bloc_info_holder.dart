// ignore_for_file: lines_longer_than_80_chars

import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_base.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_wrapper.dart';

/// Use it to store bloc in context using provider.
class BlocInfoHolder {
  final _blocsInfo = <Type, List<WildrGqlIsolateBlocWrapper>>{};

  /// Return [WildrGqlIsolateBlocWrapper]
  /// associated with given [IsolateBlocBase]'s Type.
  WildrGqlIsolateBlocWrapper<State>?
      getWrapperByType<T extends IsolateBlocBase<Object?, State>, State>() =>
          _blocsInfo[T]?.last as WildrGqlIsolateBlocWrapper<State>?;

  /// Add [WildrGqlIsolateBlocWrapper] associated with [IsolateBlocBase] type.
  void addBlocInfo<T extends IsolateBlocBase>(
    WildrGqlIsolateBlocWrapper wrapper,
  ) {
    _blocsInfo[T] ??= [];
    _blocsInfo[T]!.add(wrapper);
  }

  /// Remove [WildrGqlIsolateBlocWrapper] associated with [IsolateBlocBase].
  WildrGqlIsolateBlocWrapper? removeBloc<T extends IsolateBlocBase>() =>
      _blocsInfo[T]?.removeLast();
}
