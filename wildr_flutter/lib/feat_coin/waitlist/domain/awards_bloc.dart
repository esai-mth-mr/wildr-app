// ignore_for_file: lines_longer_than_80_chars

import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/data/coin_award.dart';

class AwardsBloc extends Bloc<AwardsEvent, AwardsState> {
  AwardsBloc() : super(const AwardsState(loading: false)) {
    on<FetchAwards>((event, emit) async {
      await _fetchAwards(emit);
    });
  }

  Future<void> _fetchAwards(Emitter<AwardsState> emit) async {
    emit(const AwardsState(loading: true));
    try {
      await Future.delayed(const Duration(seconds: 3));
      emit(
        AwardsState(
          loading: false,
          awards: _debugAwards,
        ),
      );
    } catch (e) {
      emit(AwardsState(loading: false, error: e.toString()));
    }
  }

  // Returning a list of CoinAward items for debug reasons.
  final List<CoinAward> _debugAwards = [
    CoinAward(
      id: '1',
      amount: 10,
      status: AwardStatus.completed,
      donorName: 'Wildr Team',
      dateReceived: DateTime(2023, 11, 20),
      type: AwardType.inviteAccepted,
    ),
    CoinAward(
      id: '2',
      amount: 5,
      status: AwardStatus.pending,
      donorName: 'John Doe',
      dateReceived: DateTime(2023, 11, 23, 12, 30),
      type: AwardType.inviteAccepted,
    ),
    CoinAward(
      id: '3',
      amount: 10,
      status: AwardStatus.failed,
      donorName: 'John Doe',
      dateReceived: DateTime(2023, 11, 22, 23, 59),
      type: AwardType.inviteAccepted,
    ),
  ];
}

// Events
abstract class AwardsEvent {}

class FetchAwards extends AwardsEvent {}

// State
class AwardsState {
  final bool loading;
  final List<CoinAward> awards;
  final String? error;

  const AwardsState({
    required this.loading,
    this.awards = const [],
    this.error,
  });

  bool get isEmpty => awards.isEmpty;

  @override
  String toString() => 'AwardsState(loading: $loading, awards: $awards, error: $error)';
}
