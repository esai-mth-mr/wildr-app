import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:store_redirect/store_redirect.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_app_update_banner/app_update_banner_text_styles.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AppUpdateBody extends StatelessWidget {
  const AppUpdateBody({super.key});

  @override
  Widget build(BuildContext context) => Dialog(
        backgroundColor: Colors.transparent,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.all(
              Radius.circular(14),
            ),
          ),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.0.w, vertical: 8.0.h),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: EdgeInsets.only(top: 16.0.h, bottom: 24.0.h),
                  child: CircleAvatar(
                    backgroundColor: WildrColors.emerald025,
                    radius: 36.0.sp,
                    child: WildrIcon(
                      WildrIcons.defaultImage,
                      color: WildrColors.emerald800,
                      size: 38.0.sp,
                    ),
                  ),
                ),
                Text(
                  AppLocalizations.of(context)!.app_update_title,
                  style: AppUpdateTextStyles.topTextStyle,
                ),
                SizedBox(height: 4.0.h),
                Text(
                  AppLocalizations.of(context)!.app_update_description,
                  style: AppUpdateTextStyles.satoshiFW500TextStyle,
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 24.0.h),
                PrimaryCta(
                  text: AppLocalizations.of(context)!.app_update_updateApp,
                  onPressed: () {
                    StoreRedirect.redirect(
                      iOSAppId: FlavorConfig.getValue(kAppStoreId),
                      androidAppId: FlavorConfig.getValue(kGooglePlayId),
                    );
                  },
                  filled: true,
                ),
                SizedBox(height: 8.0.h),
                PrimaryCta(
                  text: AppLocalizations.of(context)!.app_update_cap_later,
                  onPressed: Navigator.of(context).pop,
                ),
              ],
            ),
          ),
        ),
      );
}
