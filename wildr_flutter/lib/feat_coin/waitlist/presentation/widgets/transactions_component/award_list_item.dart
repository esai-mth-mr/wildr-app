import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/theme/text_style/wildr_text_styles.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_coin/waitlist/data/coin_award.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/transactions_component/coin_award_ui_extensions.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AwardListItem extends StatelessWidget {
  const AwardListItem({
    super.key,
    required this.coinAward,
    required this.onTap,
  });

  final CoinAward coinAward;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: SizedBox(
          height: 50.0.h,
          child: Row(
            children: [
              _CoinAwardIcon(awardType: coinAward.type),
              SizedBox(width: 12.0.w),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: AppLocalizations.of(context)!
                              .wildrcoin_award_received_from,
                          style: WildrTextStyles.p3Medium.withColor(
                            WildrColors.gray1100,
                          ),
                        ),
                        TextSpan(
                          text: coinAward.donorName,
                          style: WildrTextStyles.p3Semibold.withColor(
                            WildrColors.gray1100,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        coinAward.status.displayName(context),
                        style: WildrTextStyles.p4Medium.withColor(
                          coinAward.status.displayColor,
                        ),
                      ),
                      const Text(' • '),
                      Text(
                        coinAward.dateReceivedAgo,
                        style: WildrTextStyles.p4Medium.withColor(
                          WildrColors.gray500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const Spacer(),
              Align(
                alignment: Alignment.topCenter,
                child: _CoinAwardValue(
                  coinAwardValue: coinAward.amount,
                  status: coinAward.status,
                ),
              ),
            ],
          ),
        ),
      );
}

class _CoinAwardIcon extends StatelessWidget {
  const _CoinAwardIcon({
    required this.awardType,
  });

  final AwardType awardType;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 42.0.w,
        height: 42.0.h,
        child: ClipRect(
          child: Stack(
            children: [
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4.0),
                  color: WildrColors.gold400,
                ),
              ),
              const WildrIcon(
                WildrIcons.icon_background_stroke_1,
                color: WildrColors.gold100,
              ),
              Align(
                child: WildrIcon(
                  awardType.iconPath,
                  color: WildrColors.gold1000,
                ),
              ),
            ],
          ),
        ),
      );
}

class _CoinAwardValue extends StatelessWidget {
  const _CoinAwardValue({
    required this.coinAwardValue,
    required this.status,
  });

  final int coinAwardValue;
  final AwardStatus status;

  Color get _awardColor {
    switch (status) {
      case AwardStatus.pending:
      case AwardStatus.failed:
        return WildrColors.gray500;
      case AwardStatus.completed:
        return WildrColors.emerald800;
    }
  }

  @override
  Widget build(BuildContext context) => Row(
        children: [
          if (status == AwardStatus.failed)
            const SizedBox()
          else
            Text(
              '+',
              style: WildrTextStyles.p3Semibold.withColor(
                _awardColor,
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 2),
            child: WildrIcon(
              WildrIcons.wildr_coin_outlined,
              color: _awardColor,
              size: 14.0.sp,
            ),
          ),
          Text(
            coinAwardValue.toString(),
            style: WildrTextStyles.p3Semibold.withColor(
              _awardColor,
            ),
          ),
        ],
      );
}
