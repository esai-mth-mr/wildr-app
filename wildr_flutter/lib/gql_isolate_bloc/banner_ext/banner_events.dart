import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class GetBannersEvent extends MainBlocEvent {
  GetBannersEvent();
}

class JoinWildrCoinWaitlist extends MainBlocEvent {
  JoinWildrCoinWaitlist();
}

class IgnoreBannerEvent extends MainBlocEvent {
  const IgnoreBannerEvent({required this.bannerId});

  final String bannerId;
}