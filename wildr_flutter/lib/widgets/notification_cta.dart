import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent_handler.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class NotificationCTA extends StatelessWidget {
  final bool isFromChallenges;

  const NotificationCTA({super.key, this.isFromChallenges = false});

  @override
  Widget build(BuildContext context) => RepaintBoundary(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(25),
          child: GestureDetector(
            onTap: () {
              if (Common().isLoggedIn(context)) {
                context.pushRoute(const NotificationsPageRoute());
              } else {
                Common().showSnackBar(
                  context,
                  AppLocalizations.of(context)!
                      .widgets_loginSignupToSeeNotifications,
                  isDisplayingError: true,
                  millis: 2000,
                );
                Common().openLoginPage(
                  context.router,
                  callback: (_) {
                    if (Common().isLoggedIn(context)) {
                      HomePageIntentHandler().handleHomePageIntent(
                        HomePageIntent(
                          HomePageIntentType.NOTIFICATIONS_PAGE,
                          ObjectId.empty(),
                        ),
                        Common().mainBloc(context),
                        context.router,
                      );
                    }
                  },
                );
              }
            },
            child: Container(
              padding: EdgeInsets.all(10.0.w),
              color: isFromChallenges ? null : const Color(0x40000000),
              child: WildrIcon(
                WildrIcons.bell_filled,
                size: 20.0.w,
                color: isFromChallenges
                    ? WildrColors.notificationIconColor(context)
                    : WildrColors.white,
              ),
            ),
          ),
        ),
      );
}
