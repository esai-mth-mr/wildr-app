import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/transactions_component/awards_tab_content.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/transactions_component/invites_tab_content.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/transactions_component/transactions_tab_bar.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';


class WildrCoinTransactions extends StatefulWidget {
  const WildrCoinTransactions({super.key});

  @override
  State<WildrCoinTransactions> createState() => _WildrCoinTransactionsState();
}

class _WildrCoinTransactionsState extends State<WildrCoinTransactions> {
  TransactionItem _selectedTab = TransactionItem.invites;

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TransactionsTabBar(
            onTabSelected: (transactionItem) {
              setState(() {
                _selectedTab = transactionItem;
                log('Now selected tab: $_selectedTab');
              });
            },
          ),
          SizedBox(height: 24.0.h),
          if (_selectedTab == TransactionItem.invites)
            InvitesTabContent(key: UniqueKey())
          else
            const AwardsTabContent(),
          SizedBox(height: 24.0.h),
        ],
      );
}
