part of 'network_bloc.dart';

@immutable
abstract class NetworkEvent {}

class NetworkConnectedEvent extends NetworkEvent {}

class NetworkDisconnectedEvent extends NetworkEvent {}
