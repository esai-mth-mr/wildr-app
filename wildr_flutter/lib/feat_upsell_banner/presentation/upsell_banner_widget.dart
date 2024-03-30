import 'dart:async';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/gql_isolate_bloc/banner_ext/banner_events.dart';
import 'package:wildr_flutter/home/model/banner.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class UpsellBannerWidget extends StatelessWidget {
  const UpsellBannerWidget({
    super.key,
    required this.banner,
    required this.onDismissed,
    required this.onTap,
  });

  final BannerModel banner;
  final VoidCallback onDismissed;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Dismissible(
          direction: DismissDirection.up,
          onDismissed: (val) {
            unawaited(_dismissBanner(context));
            onDismissed();
          },
          key: UniqueKey(),
          child: GestureDetector(
            onTap: onTap,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: WildrColors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: WildrColors.gray100),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    if (banner.asset case final assetUrl?) ...[
                      SizedBox(
                        width: 40.0.w,
                        height: 40.0.h,
                        child: Common().imageView(
                          assetUrl,
                          borderRadius: 10,
                          boxFit: BoxFit.contain,
                        ),
                      ),
                    ],
                    SizedBox(width: 10.0.w),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          banner.title,
                          maxLines: 2,
                          style: const TextStyle(
                            fontFamily: FontFamily.satoshi,
                            fontWeight: FontWeight.w700,
                            color: WildrColors.gray1100,
                            fontSize: 14,
                          ),
                        ),
                        if (banner.description case final description?) ...[
                          Text(
                            description,
                            maxLines: 2,
                            style: const TextStyle(
                              fontFamily: FontFamily.satoshi,
                              fontWeight: FontWeight.w500,
                              color: WildrColors.gray700,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const Spacer(),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Text(
                        banner.cta,
                        style: const TextStyle(
                          fontFamily: FontFamily.satoshi,
                          fontWeight: FontWeight.w700,
                          color: WildrColors.emerald800,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 18.0.sp,
                      height: 18.0.sp,
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        onPressed: () {
                          unawaited(_dismissBanner(context));
                          onDismissed();
                        },
                        icon: Icon(
                          size: 16.0.sp,
                          Icons.close,
                          color: WildrColors.gray700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

  Future<void> _dismissBanner(BuildContext context) async {
    Common().mainBloc(context).add(IgnoreBannerEvent(bannerId: banner.id));
    await FirebaseAnalytics.instance.logEvent(
      name: BannerEvents.kBannerIgnored,
      parameters: {
        AnalyticsParameters.kBannerId: banner.id,
      },
    );
  }
}
