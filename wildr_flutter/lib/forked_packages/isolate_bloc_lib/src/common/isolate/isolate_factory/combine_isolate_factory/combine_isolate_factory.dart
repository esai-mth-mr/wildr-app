import 'package:combine/combine.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_factory/combine_isolate_factory/combine_isolate_messenger.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_factory/combine_isolate_factory/combine_isolate_wrapper.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_factory/i_isolate_factory.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/manager/ui_isolate_manager.dart';

/// Isolate factory implementation which is using
/// `combine` package to create Isolate
/// and deal with method channels.
class CombineIsolateFactory extends IIsolateFactory {
  CombineIsolateFactory([this.combineIsolateFactory]);

  final IsolateFactory? combineIsolateFactory;

  @override
  Future<IsolateCreateResult> create(
    IsolateRun isolateRun,
    Initializer initializer,
  ) async {
    final isolateFactory = combineIsolateFactory ?? effectiveIsolateFactory;
    WidgetsFlutterBinding.ensureInitialized();

    final CombineInfo isolateInfo = await isolateFactory.create((context) {
      isolateRun(CombineIsolateMessenger(context.messenger), initializer);
    });

    return IsolateCreateResult(
      CombineIsolateWrapper(isolateInfo.isolate),
      CombineIsolateMessenger(isolateInfo.messenger),
    );
  }
}
