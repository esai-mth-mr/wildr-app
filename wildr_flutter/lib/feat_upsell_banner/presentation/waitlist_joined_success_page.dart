import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:share_plus/share_plus.dart';
import 'package:wildr_flutter/common/dynamic_link/dynamic_link_builder.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WaitlistJoinedSuccessPage extends StatelessWidget {
  const WaitlistJoinedSuccessPage({super.key});

  @override
  Widget build(BuildContext context) => WillPopScope(
        onWillPop: () async => false,
        child: Scaffold(
          body: DecoratedBox(
            decoration: const BoxDecoration(
              image: DecorationImage(
                fit: BoxFit.cover,
                image: AssetImage(WildrIconsPng.waitlist_congrats_page_content),
              ),
            ),
            child: Column(
              children: [
                const Spacer(),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14.0.w),
                  child: PrimaryCta(
                    filled: true,
                    backgroundColor: WildrColors.black,
                    text: AppLocalizations.of(context)!.comm_cap_done,
                    onPressed: () {
                      context.router.popUntilRoot();
                    },
                  ),
                ),
                SizedBox(height: 12.0.h),
                TextButton(
                  onPressed: () async {
                    final link = await DynamicLinkBuilder.inviteLink(context);
                    await Share.share(
                      link,
                      subject: AppLocalizations.of(context)!
                          .wildrcoin_success_page_sharing_title,
                    );
                  },
                  child: Text(
                    AppLocalizations.of(context)!.wildrcoin_success_share_cta,
                    style: const TextStyle(
                      fontSize: 16.0,
                      fontWeight: FontWeight.w700,
                      color: WildrColors.black,
                      fontFamily: FontFamily.satoshi,
                    ),
                  ),
                ),
                SizedBox(
                  height: 20.0.h,
                ),
              ],
            ),
          ),
        ),
      );
}
