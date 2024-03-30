part of 'network_bloc.dart';

@immutable
abstract class NetworkState {}

class ConnectionInitialState extends NetworkState {}

class NetworkConnectedState extends NetworkState {}

class NetworkDisconnectedState extends NetworkState {}
