import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/wildr_coin.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CoinCounter extends StatelessWidget {
  const CoinCounter({
    super.key,
    required this.count,
    required this.isLoading,
  });

  final int count;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final defaultSize = Size(160.0.w, 90.0.h);
    return isLoading
        ? Align(
            child: Common().wrapInShimmer(
              Container(
                width: defaultSize.width,
                height: defaultSize.height,
                decoration: const BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                ),
              ),
              context: context,
            ),
          )
        : Align(
            child: SizedBox(
              width: defaultSize.width,
              height: defaultSize.height,
              child: Center(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Column(
                      children: [
                        Text(
                          AppLocalizations.of(context)!
                              .wildrcoin_dashboard_coin_balance,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            fontFamily: FontFamily.satoshi,
                            color: WildrColors.gray900,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$count',
                          style: TextStyle(
                            fontSize: 64,
                            color: WildrColors.textColorStrong(context),
                            fontFamily: FontFamily.slussenExpanded,
                            height: 1,
                          ),
                        ),
                      ],
                    ),
                    const Positioned(
                      left: -30,
                      top: 20,
                      child: WildrCoinIcon(size: 20),
                    ),
                  ],
                ),
              ),
            ),
          );
  }
}
