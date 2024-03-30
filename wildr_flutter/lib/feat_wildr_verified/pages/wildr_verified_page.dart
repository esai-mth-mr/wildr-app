import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_wildr_verified/pages/wildr_verified_intro_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class WildrVerifiedPage extends StatelessWidget {
  const WildrVerifiedPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          elevation: 0,
          leading: const SizedBox(),
          title:
              Text(AppLocalizations.of(context)!.wildr_verify_youAreVerified),
        ),
        body: Padding(
          padding: EdgeInsets.only(top: Get.height * 0.1),
          child: Stack(
            children: [
              const WildrIcon(
                WildrIcons.whyWildr,
                color: WildrColors.emerald800,
              ),
              _titleAndSubTitle(context),
            ],
          ),
        ),
        bottomNavigationBar: _buildBottomNav(context),
      );

  Widget _buildBottomNav(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: Get.height * 0.05),
        child: _doneBtn(context),
      );

  Widget _titleAndSubTitle(BuildContext context) => Positioned(
        left: 0,
        right: 0,
        top: Get.height * 0.4,
        child: Column(
          children: [
            TitleText(
              title: AppLocalizations.of(context)!.wildr_verify_youAreAllSet,
            ),
            const SizedBox(
              height: 4,
            ),
            SubTitleText(
              subTitle: AppLocalizations.of(context)!
                  .wildr_verify_verificationCompletionNotification,
            ),
          ],
        ),
      );

  Widget _doneBtn(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedBtn(
            onTap: () async {
              context.router
                  .popUntilRouteWithName(WildrVerifyIntroPageRoute.name);
              Navigator.pop(context);
            },
            btnTitle: AppLocalizations.of(context)!.comm_cap_done,
          ),
        ),
      );
}
