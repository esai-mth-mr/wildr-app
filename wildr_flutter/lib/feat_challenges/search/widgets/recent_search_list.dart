import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class RecentSearchList extends StatelessWidget {
  final List<String> recentSearch;

  const RecentSearchList({super.key, required this.recentSearch});

  @override
  Widget build(BuildContext context) => SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) => Padding(
            padding: EdgeInsets.only(
              top: 8.0.h,
              bottom: 8.0.h,
              left: 56.0.w,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Center(
                  child: Text(
                    recentSearch[index],
                    style: TextStyle(
                      color: WildrColors.white,
                      fontSize: 16.0.sp,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
                const Spacer(),
                Padding(
                  padding: EdgeInsets.only(right: 14.0.w),
                  child: WildrIcon(
                    WildrIcons.closeIcon,
                    size: 15.0.wh,
                    color: WildrColors.white,
                  ),
                ),
              ],
            ),
          ),
        childCount: recentSearch.length >= 3 ? 3 : recentSearch.length,
      ),
    );
}
