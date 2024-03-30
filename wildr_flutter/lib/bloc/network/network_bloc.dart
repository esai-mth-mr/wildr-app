import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';

part 'network_event.dart';
part 'network_state.dart';

class NetworkBloc extends Bloc<NetworkEvent, NetworkState> {
  StreamSubscription? connectivitySubscription;
  late final FirebaseAnalytics analytics;
  bool isConnected = true;

  NetworkBloc({
    required this.analytics,
  }) : super(ConnectionInitialState()) {
    on<NetworkConnectedEvent>((event, emit) => emit(NetworkConnectedState()));
    on<NetworkDisconnectedEvent>(
      (event, emit) => emit(NetworkDisconnectedState()),
    );
    connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((result) {
      if (result == ConnectivityResult.mobile ||
          result == ConnectivityResult.wifi) {
        isConnected = true;
        add(NetworkConnectedEvent());
      } else {
        isConnected = false;
        add(NetworkDisconnectedEvent());
      }
    });
  }

  @override
  Future<void> close() {
    connectivitySubscription?.cancel();
    return super.close();
  }
}
