// ignore_for_file: one_member_abstracts

import 'dart:async';

import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_factory/i_isolate_messenger.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_factory/i_isolate_wrapper.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/manager/ui_isolate_manager.dart';

/// Abstract factory which is used to create and initialize
/// [IIsolateWrapper] and [IIsolateMessenger].
abstract class IIsolateFactory {
  /// Function which creates and initializes
  /// [IIsolateWrapper] and [IIsolateMessenger].
  Future<IsolateCreateResult> create(
    IsolateRun isolateRun,
    Initializer initializer,
  );
}

/// Signature for function which will run in Isolate.
typedef IsolateRun = FutureOr<void> Function(
  IIsolateMessenger messenger,
  Initializer initializer,
);

class IsolateCreateResult {
  IsolateCreateResult(this.isolate, this.messenger);

  final IIsolateWrapper isolate;
  final IIsolateMessenger messenger;
}
