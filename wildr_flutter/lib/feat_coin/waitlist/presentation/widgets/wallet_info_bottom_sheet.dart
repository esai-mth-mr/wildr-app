// ignore_for_file: lines_longer_than_80_chars

import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/widget/bottom_sheet_base.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WalletInfoBottomSheet extends StatelessWidget {
  const WalletInfoBottomSheet({
    super.key,
    required this.currentWildrCoinValue,
    required this.availableToWithdrawValue,
    required this.pendingWithdrawValue,
    required this.currentCoinExchangeRate,
  });

  final double currentWildrCoinValue;
  final double availableToWithdrawValue;
  final double pendingWithdrawValue;
  final double currentCoinExchangeRate;

  void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => this,
    );
  }

  @override
  Widget build(BuildContext context) => BottomSheetBase(
        shrinkWrap: true,
        child: Padding(
          padding: EdgeInsets.only(
            left: 20.0.w,
            right: 20.0.w,
            bottom: 32.0.h,
          ),
          child: Column(
            children: [
              Text(
                AppLocalizations.of(context)!.wildrcoin_about_wallet_title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: WildrColors.gray1200,
                  fontFamily: FontFamily.satoshi,
                ),
              ),
              Text(
                AppLocalizations.of(context)!.wildrcoin_about_wallet_subtitle,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: WildrColors.gray700,
                  fontFamily: FontFamily.satoshi,
                ),
              ),
              SizedBox(height: 16.0.h),
              _WalletInfoItem(
                title: AppLocalizations.of(context)!
                    .wildrcoin_about_wallet_current_value,
                subtitle: _exchangeRateDisplayString(
                  context,
                  rate: currentCoinExchangeRate,
                ),
                value: currentWildrCoinValue * currentCoinExchangeRate,
                currency: '₹',
              ),
              const Divider(thickness: 1),
              _WalletInfoItem(
                title: AppLocalizations.of(context)!
                    .wildrcoin_about_wallet_available,
                value: availableToWithdrawValue * currentCoinExchangeRate,
                currency: '₹',
              ),
              const Divider(thickness: 1),
              _WalletInfoItem(
                title: AppLocalizations.of(context)!
                    .wildrcoin_about_wallet_pending,
                value: pendingWithdrawValue * currentCoinExchangeRate,
                currency: '₹',
              ),
            ],
          ),
        ),
      );

  String _exchangeRateDisplayString(
    BuildContext context, {
    required double rate,
  }) =>
      '1 ${AppLocalizations.of(context)!.wildrcoin_about_wallet_wildrcoin} = ₹$rate';
}

class _WalletInfoItem extends StatelessWidget {
  const _WalletInfoItem({
    required this.title,
    required this.value,
    this.subtitle,
    required this.currency,
  });

  final String title;
  final String? subtitle;
  final double value;
  final String currency;

  @override
  Widget build(BuildContext context) => ConstrainedBox(
        constraints: BoxConstraints(minHeight: 58.0.h),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 16.0.h),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: WildrColors.gray1200,
                      fontFamily: FontFamily.satoshi,
                    ),
                  ),
                  if (subtitle case final subtitle?)
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: WildrColors.gray700,
                        fontFamily: FontFamily.satoshi,
                      ),
                    ),
                ],
              ),
              const Spacer(),
              Column(
                children: [
                  Text(
                    '$currency${value.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      fontFamily: FontFamily.satoshi,
                      color: WildrColors.gray700,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
}
