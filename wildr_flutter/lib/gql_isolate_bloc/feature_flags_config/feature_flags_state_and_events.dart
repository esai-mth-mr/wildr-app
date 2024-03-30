import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_config.dart';

class GetFeatureFlagsEvent extends MainBlocEvent {
  @override
  bool shouldLogEvent() => false;
}

class GetFeatureFlagsState extends MainState {
  late final FeatureFlagsConfig? config;

  GetFeatureFlagsState(this.config);
}
