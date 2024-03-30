// ignore_for_file: lines_longer_than_80_chars

import 'package:flutter_test/flutter_test.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_event.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_state.dart';

void main() {
  group('WalletBloc', () {
    late CoinWaitlistBloc bloc;

    setUp(() {
      bloc = CoinWaitlistBloc();
    });

    tearDown(() {
      bloc.close();
    });

    test(
        'emits [LoadingWalletState, LoadedWalletState] when fetchWaitlistData is successful',
        () async* {
      // Act
      bloc.add(FetchWaitlistEvent());

      // Assert
      await expectLater(
        bloc,
        emitsInOrder([
          CoinWaitlistState(isLoading: true),
          CoinWaitlistState(
            isLoading: false,
            waitlistUrl: 'https://wildr.com/waitlist/xyz',
            coinBalance: 100,
            sentInvites: ['friend1@example.com', 'friend2@example.com'],
            invitesLeftForAReward: 5,
            rewardValue: 20,
          ),
        ]),
      );
    });

    test(
        'emits [LoadingWalletState, WalletState(isError: true)] when fetchWaitlistData fails',
        () async* {
      // Arrange
      // Simulate an error by not providing the expected data

      // Act
      bloc.add(FetchWaitlistEvent());

      // Assert
      await expectLater(
        bloc,
        emitsInOrder([
          CoinWaitlistState(isLoading: true),
          CoinWaitlistState(isLoading: false, isError: true),
        ]),
      );
    });
  });
}
