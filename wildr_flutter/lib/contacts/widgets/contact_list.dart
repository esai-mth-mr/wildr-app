import 'package:azlistview/azlistview.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/contacts/data/contact_info.dart';
import 'package:wildr_flutter/contacts/widgets/contact_list_tile.dart';
import 'package:wildr_flutter/contacts/widgets/contact_suspension_header_widget.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ContactList extends StatelessWidget {
  final List<ContactInfo> contacts;
  final UserListType userListType;

  const ContactList(this.contacts, {super.key, required this.userListType});

  @override
  Widget build(BuildContext context) => AzListView(
      data: contacts,
      itemCount: contacts.length,
      itemBuilder: (context, index) => Padding(
        padding: EdgeInsets.only(right: 30.0.w),
        child: Column(
          children: <Widget>[
            Offstage(
              offstage: !contacts[index].isShowSuspension,
              child: ContactSuspensionHeaderWidget(contacts[index]),
            ),
            ContactListTile(
              contacts[index],
              userListType: userListType,
            ),
          ],
        ),
      ),
      physics: const BouncingScrollPhysics(),
      indexBarData: SuspensionUtil.getTagIndexList(contacts),
      indexHintBuilder: (context, hint) => Container(
        alignment: Alignment.center,
        width: 60.0.w,
        height: 60.0.w,
        decoration: BoxDecoration(
          color: WildrColors.primaryColor.withAlpha(200),
          shape: BoxShape.circle,
        ),
        child: Text(
          hint,
          style: const TextStyle(color: Colors.white, fontSize: 30.0),
        ),
      ),
      indexBarMargin: const EdgeInsets.all(10),
      indexBarOptions: const IndexBarOptions(
        needRebuild: true,
      ),
    );
}
