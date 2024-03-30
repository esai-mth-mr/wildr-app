import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/home/model/banner.dart';

class CanShowBannerState extends MainState {
  CanShowBannerState({
    this.banner,
  }) : super();

  final BannerModel? banner;
}

class WildrCoinWaitlistSignedUpState extends MainState {
  WildrCoinWaitlistSignedUpState({
    required this.signedUpSuccessfully,
  }) : super();

  final bool signedUpSuccessfully;
}

class WildrCoinWaitlistSignedUpErrorState extends MainState {
  WildrCoinWaitlistSignedUpErrorState({
    required this.errorMessage,
  }) : super();

  final String errorMessage;
}