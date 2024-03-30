import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:share_plus/share_plus.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/wildr_coin.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ShareLinkBox extends StatelessWidget {
  const ShareLinkBox({
    super.key,
    required this.isLoading,
    required this.url,
    required this.invitedFriendsCount,
    required this.coinRewardValue,
  });

  final bool isLoading;
  final String? url;
  final int? coinRewardValue;
  final int? invitedFriendsCount;

  @override
  Widget build(BuildContext context) => isLoading
      ? Common().wrapInShimmer(
          context: context,
          _BoxContent(
            url: url,
            coinRewardValue: coinRewardValue,
            invitedFriendsCount: invitedFriendsCount,
          ),
        )
      : AnimatedContainer(
          duration: const Duration(milliseconds: 1500),
          child: _BoxContent(
            url: url,
            coinRewardValue: coinRewardValue,
            invitedFriendsCount: invitedFriendsCount,
          ),
        );
}

class _BoxContent extends StatelessWidget {
  const _BoxContent({
    this.url,
    this.coinRewardValue,
    this.invitedFriendsCount,
  });

  final String? url;
  final int? coinRewardValue;
  final int? invitedFriendsCount;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
          color: WildrColors.gray100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 14),
                  Text(
                    AppLocalizations.of(context)!
                        .wildrcoin_dashboard_invite_friends_title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      fontFamily: FontFamily.satoshi,
                      color: WildrColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        color: WildrColors.gray900,
                        fontSize: 14,
                        fontFamily: FontFamily.satoshi,
                        fontWeight: FontWeight.w500,
                      ),
                      children: [
                        TextSpan(
                          text: AppLocalizations.of(context)!
                              .wildrcoin_dashboard_invite_friends_copy_part_1,
                        ),
                        const TextSpan(text: ' '),
                        wildrCoinTextSpan(
                          context,
                          value: coinRewardValue ?? 0,
                          fontAndIconSize: 14,
                        ),
                        const TextSpan(text: ' '),
                        TextSpan(
                          text: AppLocalizations.of(context)!
                              .wildrcoin_dashboard_invite_friends_copy_part_2,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  CopyableTextField(url: url),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14.0),
              child: PrimaryCta(
                filled: true,
                text: AppLocalizations.of(context)!
                    .wildrcoin_dashboard_invite_friends_cta,
                onPressed: () {
                  if (url case final url?) {
                    Share.share(url);
                  }
                },
              ),
            ),
          ],
        ),
      );
}

class CopyableTextField extends StatefulWidget {
  const CopyableTextField({super.key, this.url});

  final String? url;

  @override
  State<CopyableTextField> createState() => _CopyableTextFieldState();
}

class _CopyableTextFieldState extends State<CopyableTextField> {
  bool _isTapped = false;

  void _copyLink(String link) {
    Clipboard.setData(
      ClipboardData(text: link),
    );
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () {
          _copyLink(widget.url ?? '');

          // ignore: no_literal_bool_comparisons
          if (_isTapped == false) {
            setState(() {
              _isTapped = !_isTapped;
            });
          }
          if (_isTapped) {
            Future.delayed(const Duration(seconds: 5), () {
              setState(() {
                _isTapped = false;
              });
            });
          }
        },
        child: AnimatedContainer(
          duration: const Duration(seconds: 1),
          height: 50.0.h,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: WildrColors.white,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: _isTapped
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppLocalizations.of(context)!
                            .wildrcoin_dashboard_link_copied,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: WildrColors.emerald700,
                          fontFamily: FontFamily.satoshi,
                        ),
                      ),
                      const WildrIcon(
                        WildrIcons.copied_icon_outlined,
                        color: WildrColors.emerald700,
                      ),
                    ],
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SelectableText(
                        widget.url ?? '',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: WildrColors.gray900,
                          fontFamily: FontFamily.satoshi,
                          height: 1,
                        ),
                      ),
                      const Expanded(child: SizedBox()),
                      const WildrIcon(
                        WildrIcons.copyIcon,
                        color: WildrColors.gray900,
                        size: 24,
                      ),
                    ],
                  ),
          ),
        ),
      );
}
