import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_event.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_state.dart';

class CoinWaitlistBloc extends Bloc<CoinWaitlistEvent, CoinWaitlistState> {
  CoinWaitlistBloc() : super(CoinWaitlistState(isLoading: false)) {
    on<FetchWaitlistEvent>((event, emit) async {
      await fetchWaitlistData(emit);
    });
  }

  Future<void> fetchWaitlistData(Emitter<CoinWaitlistState> emit) async {
    emit(CoinWaitlistState(isLoading: true));
    try {
      await Future.delayed(const Duration(seconds: 5));

      final data = {
        'waitlistUrl': 'https://example.com/waitlist',
        'coinBalance': 10,
        'sentInvites': ['friend1@example.com', 'friend2@example.com'],
        'invitesLeftForAReward': 3,
        'rewardValue': 10,
      };

      emit(
        CoinWaitlistState(
          isLoading: false,
          waitlistUrl: data['waitlistUrl'] as String?,
          coinBalance: data['coinBalance']! as int,
          sentInvites: List<String>.from(data['sentInvites']! as List<String?>),
          invitesLeftForAReward: data['invitesLeftForAReward']! as int,
          rewardValue: data['rewardValue']! as int,
        ),
      );
    } catch (e) {
      emit(CoinWaitlistState(isLoading: false, isError: true));
    }
  }
}
