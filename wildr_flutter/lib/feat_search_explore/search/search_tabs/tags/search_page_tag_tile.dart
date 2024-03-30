import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/home/model/search_mention_res.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SearchPageTagTile extends StatelessWidget {
  final Tag tag;

  const SearchPageTagTile(this.tag, {super.key});

  @override
  Widget build(BuildContext context) => ListTile(
      dense: false,
      contentPadding: const EdgeInsets.only(top: 10, left: 10),
      leading: const CircleAvatar(
        backgroundColor: WildrColors.primaryColor,
        radius: 22.5,
        child: WildrIcon(WildrIcons.hashtag_filled, color: Colors.white),
      ),
      title: Text(
        '#${tag.name}',
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 13.0.sp,
        ),
      ),

      // subtitle: Text("", style: _subtitleStyle),
      onTap: () =>
          context.pushRoute(SearchSingleTagPageRoute(tagName: tag.name)),
    );
}
