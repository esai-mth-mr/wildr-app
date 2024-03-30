import 'package:combine/combine.dart';
import 'package:wildr_flutter/forked_packages/isolate_bloc_lib/src/common/isolate/isolate_factory/i_isolate_wrapper.dart';

class CombineIsolateWrapper extends IIsolateWrapper {
  CombineIsolateWrapper(this.combineIsolate);

  final CombineIsolate combineIsolate;

  @override
  void kill() {
    combineIsolate.kill();
  }
}
