import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_fgbg/flutter_fgbg.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:restart_app/restart_app.dart';
import 'package:store_redirect/store_redirect.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ForceUpdatePage extends StatefulWidget {
  const ForceUpdatePage({super.key});

  @override
  State<ForceUpdatePage> createState() => _ForceUpdatePageState();
}

class _ForceUpdatePageState extends State<ForceUpdatePage> {
  bool _didRedirectToStore = false;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  Widget _sparkle() => Common().wrapItWithRing(
        bgColor:
            Get.isDarkMode ? WildrColors.bgColorDark : const Color(0x00fbfbfb),
        child: Common().clipIt(
          radius: 100,
          child: ColoredBox(
            color: Get.isDarkMode
                ? WildrColors.bgColorDark
                : const Color(0x00fbfbfb),
            child: Text(
              '✨',
              style: TextStyle(
                fontSize: 60.0.sp,
              ),
            ),
          ),
        ),
        score: 5,
        currentStrikeCount: 0,
        ringDiff: 30,
        ringWidth: 5,
        padding: 0,
      );

  Text _title() => Text(
        _appLocalizations.force_update_newUpdateAvailable,
        style: TextStyle(
          fontSize: 25,
          fontWeight: FontWeight.w600,
          color: WildrColors.textColorStrong(),
        ),
      );

  Widget _updateButton() => PrimaryCta(
        text: _appLocalizations.force_update_updateApp,
        onPressed: () {
          _didRedirectToStore = true;
          StoreRedirect.redirect(
            iOSAppId: FlavorConfig.getValue(kAppStoreId),
            androidAppId: 'com.wildr.app',
          );
        },
        filled: true,
      );

  Widget _infoText() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Text(
          _appLocalizations.force_update_updateAppForNewFeaturesMessage,
          style: TextStyle(
            fontSize: 18,
            color: WildrColors.textColorSoft(context),
          ),
          textAlign: TextAlign.center,
        ),
      );

  Widget _body() => Column(
        children: [
          const Spacer(),
          _sparkle(),
          const SizedBox(height: 20),
          _title(),
          const SizedBox(height: 10),
          _infoText(),
          const Spacer(),
          const Spacer(),
          _updateButton(),
          const SizedBox(height: 10),
        ],
      );

  @override
  Widget build(BuildContext context) => FGBGNotifier(
        onEvent: (event) {
          if (event == FGBGType.foreground && _didRedirectToStore) {
            Restart.restartApp();
          }
        },
        child: WillPopScope(
          child: Scaffold(
            appBar: AppBar(
              systemOverlayStyle: Get.isDarkMode
                  ? SystemUiOverlayStyle.light
                  : SystemUiOverlayStyle.dark,
              backgroundColor: Colors.transparent,
              leading: const SizedBox(),
              elevation: 0,
            ),
            // backgroundColor: Colors.black,
            body: SafeArea(
              child: Center(
                child: _body(),
              ),
            ),
          ),
          onWillPop: () async => false,
        ),
      );
}
