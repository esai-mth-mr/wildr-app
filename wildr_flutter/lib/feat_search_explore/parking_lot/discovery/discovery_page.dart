import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:focused_menu/focused_menu.dart';
import 'package:focused_menu/modals.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_search_explore/sd_search_box.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DiscoveryPage extends StatefulWidget {
  const DiscoveryPage({super.key});

  @override
  DiscoveryPageState createState() => DiscoveryPageState();
}

class DiscoveryPageState extends State<DiscoveryPage> {
  @override
  void initState() {
    super.initState();
  }

  Widget _topView() {
    final Color bgColor = Theme.of(context).colorScheme.background;
    final Widget filterBtn = ClipRRect(
      borderRadius: BorderRadius.circular(15),
      child: Container(
        height: 31,
        padding: const EdgeInsets.only(left: 10),
        color: const Color(0x40000000),
        child: FocusedMenuHolder(
          menuWidth: MediaQuery.of(context).size.width * 0.50,
          blurSize: 5.0,
          menuBoxDecoration: const BoxDecoration(
            //color: AppColor.primarySwatches[300],
            borderRadius: BorderRadius.all(
              Radius.circular(
                15.0,
              ),
            ),
          ),
          duration: const Duration(milliseconds: 100),
          animateMenuItems: true,
          blurBackgroundColor: Colors.black54,
          openWithTap: true,
          // Open Focused-Menu on Tap rather than Long Press
          menuOffset: 10.0,
          // Offset value to show menuItem from the selected item
          menuItems: <FocusedMenuItem>[
            //TODO: FIX ICONS!
            // Add Each FocusedMenuItem  for Menu Options
            FocusedMenuItem(
              backgroundColor: bgColor,
              title: const Text('All'),
              trailingIcon: Icon(
                Icons.format_align_right_outlined,
                color: WildrColors.primarySwatches[600],
              ),
              onPressed: () {},
            ),
            FocusedMenuItem(
              backgroundColor: bgColor,
              title: const Text('Text'),
              trailingIcon: Icon(
                Icons.text_fields,
                color: WildrColors.primarySwatches[600],
              ),
              onPressed: () {},
            ),
            FocusedMenuItem(
              backgroundColor: bgColor,
              title: const Text('Image'),
              trailingIcon: Icon(
                Icons.image_rounded,
                color: WildrColors.primarySwatches[600],
              ),
              onPressed: () {},
            ),
            FocusedMenuItem(
              backgroundColor: bgColor,
              title: const Text('Video'),
              trailingIcon: Icon(
                Icons.ondemand_video,
                color: WildrColors.primarySwatches[600],
              ),
              onPressed: () {},
            ),
          ],
          onPressed: () {},
          child: Row(
            children: [
              Text(
                'All',
                style: TextStyle(
                  fontSize: 18.0.sp,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xD9FFFFFF),
                ),
              ),
              const WildrIcon(
                WildrIcons.chevron_down_filled,
                color: Color(0xD9FFFFFF),
              ),
            ],
          ),
        ),
      ),
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        filterBtn,
        //toggleViewBtn,
      ],
    );
  }

  Widget _topViewSuggestions() => Expanded(
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 5,
        itemBuilder: (context, index) => const Padding(
            padding: EdgeInsets.only(left: 10.0),
            child: Chip(
              label: Text(
                '#Photographs',
                //style: TextStyle(color: Colors.white),
              ),
              //backgroundColor: AppColor.primaryColor,
            ),
          ),
      ),
    );

  Widget _searchBox() => Padding(
      padding: const EdgeInsets.only(
        left: 20,
        right: 20,
      ),
      child: GestureDetector(
        onTap: () {
          print('HERE!');
          context.pushRoute(SearchPageRoute());
        },
        child: const Hero(
          tag: 'D&S_SearchTextField',
          child: AbsorbPointer(
            child: SDSearchBox(
              placeholder: 'Search',
            ),
          ),
        ),
      ),
    );

  @override
  Widget build(BuildContext context) => Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              backgroundColor: Theme.of(context).colorScheme.background,
              floating: true,
              forceElevated: true,
              title: _topView(),
              expandedHeight: 160,
              flexibleSpace: FlexibleSpaceBar(
                background: Column(
                  children: [
                    const SizedBox(
                      height: 60,
                    ),
                    _searchBox(),
                    _topViewSuggestions(),
                  ],
                ),
              ),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => ListTile(
                    title: Text('$index Index'),
                  ),
                childCount: 100,
              ),
            ),
          ],
        ),
      ),
    );
}
