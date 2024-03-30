import 'package:flutter/widgets.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/wildr_coin.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WaitlistInvitesRewardText extends StatelessWidget {
  const WaitlistInvitesRewardText({
    super.key,
    required this.invitesLeftCount,
    required this.rewardValue,
    required this.isLoading,
  });

  final int? invitesLeftCount;
  final int? rewardValue;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Common().wrapInShimmer(
        context: context,
        Container(
          height: 30,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: WildrColors.gray100,
          ),
        ),
      );
    } else if (invitesLeftCount == null || rewardValue == null) {
      return _Content(
        invitesLeftCount: invitesLeftCount!,
        rewardValue: rewardValue!,
      );
    } else {
      return const SizedBox();
    }
  }
}

class _Content extends StatelessWidget {
  const _Content({
    required this.invitesLeftCount,
    required this.rewardValue,
  });

  final int invitesLeftCount;
  final int rewardValue;

  @override
  Widget build(BuildContext context) => RichText(
        text: TextSpan(
          style: TextStyle(
            color: WildrColors.textColor(context),
            fontSize: 16,
            fontFamily: FontFamily.satoshi,
            fontWeight: FontWeight.w700,
          ),
          children: [
            TextSpan(
              text: '$invitesLeftCount ' +
                  AppLocalizations.of(context)!
                      .wildrcoin_dashboard_x_invites_to_get_copy,
            ),
            const TextSpan(text: ' '),
            wildrCoinTextSpan(
              context,
              value: rewardValue,
              showWildrCoinName: true,
            ),
          ],
        ),
      );
}
