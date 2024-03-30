// ignore_for_file: prefer-match-file-name, lines_longer_than_80_chars
import 'package:flavor_config/flavor_config.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_base.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/bloc/isolate_bloc_wrapper.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/initializer/isolate_initializer.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_factory/combine_isolate_factory/combine_isolate_factory.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/manager/isolate_manager.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/manager/ui_isolate_manager.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/method_channel/method_channel_setup.dart';

/// Initializes [UIIsolateManager] and [IsolateManager] in `Isolate` and runs [userInitializer].
///
/// If already initialized kills previous `Isolate` and creates new one.
///
/// Simply call this function at the start of main:
/// ```
/// Future<void> main() async {
///   await initialize(initializerFunc);
///
///   runApp(...);
/// }
///
/// void initializerFunc() {
///   register<Bloc, State>(create: () => Bloc());
/// }
/// ```
Future<void> initializeIsolateBloc(
  Initializer userInitializer, {
  @Deprecated(
    "Now you don't need to provide a method channel names to override them. "
    'They will be overridden by `combine` package.',
  )
  MethodChannelSetup methodChannelSetup = const MethodChannelSetup(),
}) async =>
    IsolateInitializer().initialize(
      userInitializer,
      CombineIsolateFactory(),
    );

/// {@template create_bloc}
/// Starts creating [IsolateBlocBase] and returns [WildrGqlIsolateBlocWrapper].
///
/// Throws [UIIsolateManagerUnInitialized] if [UIIsolateManager] is null or in another words if you
/// didn't call [initializeIsolateBloc] function before.
///
/// How to use:
/// ```
/// // Create bloc.
/// final counterBloc = createBloc<CounterBloc, int>();
/// // Add event
/// counterBloc.add(CounterEvent.increment);
/// // Receive states.
/// counterBloc.stream.listen((state) => print('New state: $state')) // Prints "New state: 1".
/// ```
/// {@endtemplate}
WildrGqlIsolateBlocWrapper<S>
    createIsolateBloc<B extends IsolateBlocBase<Object?, S>, S>() {
  final isolateManager = UIIsolateManager.instance;
  if (isolateManager == null) {
    throw UIIsolateManagerUnInitialized();
  } else {
    return isolateManager.createIsolateBloc<B, S>(
      envName: FlavorConfig.getValue(kEnvironment),
    );
  }
}

/// This exception indicates that [initializeIsolateBloc] function wasn't called.
class UIIsolateManagerUnInitialized implements Exception {
  @override
  String toString() =>
      '$UIIsolateManager must not be null. Call `await initialize()`';
}
