// ignore_for_file: lines_longer_than_80_chars

class CoinWaitlistState {
  final bool isLoading;
  final bool isError;
  final String? errorMessage;
  final String? waitlistUrl;
  final int? coinBalance;
  final List<String>? sentInvites;
  final int? invitesLeftForAReward;
  final int? rewardValue;

  CoinWaitlistState({
    required this.isLoading,
    this.isError = false,
    this.errorMessage,
    this.waitlistUrl,
    this.coinBalance,
    this.sentInvites,
    this.invitesLeftForAReward,
    this.rewardValue,
  });

  @override
  String toString() =>
      'CoinWaitlistState{isLoading: $isLoading, isError: $isError, errorMessage: $errorMessage, waitlistUrl: $waitlistUrl, coinBalance: $coinBalance, sentInvites: $sentInvites, invitesLeftForAReward: $invitesLeftForAReward, rewardValue: $rewardValue}';
}
