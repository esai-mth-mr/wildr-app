import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/awards_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_event.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/coin_waitlist_state.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/invites_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/coin_counter.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/share_link_box.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/transactions_component/wildr_coin_transactions.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/wallet_app_bar.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/wallet_info_bottom_sheet.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class WalletWaitlistDashboardPage extends StatefulWidget {
  const WalletWaitlistDashboardPage({super.key});

  @override
  State<WalletWaitlistDashboardPage> createState() =>
      _WalletWaitlistDashboardPageState();
}

class _WalletWaitlistDashboardPageState
    extends State<WalletWaitlistDashboardPage> {
  final RefreshController _refreshController = RefreshController();

  @override
  void initState() {
    context.read<CoinWaitlistBloc>().add(FetchWaitlistEvent());
    context.read<InvitesBloc>().add(FetchInvites());
    context.read<AwardsBloc>().add(FetchAwards());
    super.initState();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: WalletAppBar(
          onInfoTap: () {
            const WalletInfoBottomSheet(
              currentWildrCoinValue: 1,
              availableToWithdrawValue: 2,
              pendingWithdrawValue: 3,
              currentCoinExchangeRate: 0.02,
            ).show(context);
          },
          onSettingsTap: () {},
          onNotificationsTap: () {},
        ),
        body: BlocConsumer<CoinWaitlistBloc, CoinWaitlistState>(
          bloc: context.read<CoinWaitlistBloc>(),
          listener: (context, state) {
            if (state.isError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content:
                      Text(AppLocalizations.of(context)!.comm_errorOopsMessage),
                ),
              );
            }
            // ignore: no_literal_bool_comparisons
            if (state.isLoading == false) {
              _refreshController.refreshCompleted();
            }
          },
          builder: (context, state) => SmartRefresher(
            header: Common().defaultClassicHeader,
            controller: _refreshController,
            onRefresh: () {
              context.read<CoinWaitlistBloc>().add(FetchWaitlistEvent());
              context.read<InvitesBloc>().add(FetchInvites());
              context.read<AwardsBloc>().add(FetchAwards());
            },
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: SingleChildScrollView(
                  child: Column(
                    children: <Widget>[
                      Padding(
                        padding: const EdgeInsets.only(top: 24.0, bottom: 32.0),
                        child: CoinCounter(
                          count: 10,
                          isLoading: state.isLoading,
                        ),
                      ),
                      ShareLinkBox(
                        isLoading: state.isLoading,
                        url: state.waitlistUrl,
                        invitedFriendsCount: state.invitesLeftForAReward,
                        coinRewardValue: 10,
                      ),
                      SizedBox(height: 14.0.h),
                      const WildrCoinTransactions(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
}
