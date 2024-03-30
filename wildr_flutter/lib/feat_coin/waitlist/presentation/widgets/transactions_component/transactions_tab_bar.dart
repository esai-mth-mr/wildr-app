import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

enum TransactionItem { invites, awards }

class TransactionsTabBar extends StatefulWidget {
  final ValueChanged<TransactionItem> onTabSelected;

  const TransactionsTabBar({super.key, required this.onTabSelected});

  @override
  State<TransactionsTabBar> createState() => _TransactionsTabBarState();
}

class _TransactionsTabBarState extends State<TransactionsTabBar>
    with TickerProviderStateMixin {
  TransactionItem _selectedTab = TransactionItem.invites;
  late final TabController _tabController;

  void _onTabSelected(TransactionItem tab) {
    setState(() {
      _selectedTab = tab;
      widget.onTabSelected(tab);
    });
  }

  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this);
    super.initState();
  }

  @override
  Widget build(BuildContext context) => Container(
        height: 37.0.h,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(100.0),
        ),
        child: TabBar(
          controller: _tabController,
          onTap: (index) {
            final item =
                index == 0 ? TransactionItem.invites : TransactionItem.awards;
            _onTabSelected(item);
          },
          indicator: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(100.0),
          ),
          tabs: [
            _Tab(
              name: AppLocalizations.of(context)!.wildrcoin_invites,
              isSelected: _selectedTab == TransactionItem.invites,
            ),
            _Tab(
              name: AppLocalizations.of(context)!.wildrcoin_awards,
              isSelected: _selectedTab == TransactionItem.awards,
            ),
          ],
        ),
      );
}

class _Tab extends StatelessWidget {
  const _Tab({
    required this.name,
    required this.isSelected,
  });

  final String name;
  final bool isSelected;

  @override
  Widget build(BuildContext context) => Tab(
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: isSelected ? Colors.black : Colors.white,
            borderRadius: BorderRadius.circular(100.0),
          ),
          child: Align(
            child: Text(
              name,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black,
              ),
            ),
          ),
        ),
      );
}
