import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/contacts/data/contact_info.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/widgets/buttons/wildr_outline_button.dart';

class ContactListTile extends StatelessWidget {
  final ContactInfo contactInfo;
  final UserListType userListType;

  const ContactListTile(
    this.contactInfo, {
    super.key,
    required this.userListType,
  });

  void onPressed(BuildContext context) {
    context.loaderOverlay.show();
    userListType.generateInviteCode(context, contactInfo.phone);
  }

  WildrOutlineButton _trailingButton(BuildContext context) {
    switch (userListType) {
      case UserListType.FOLLOWING:
        return WildrOutlineButton(
          text: AppLocalizations.of(context)!.comm_cap_invite,
          onPressed: () => onPressed(context),
        );
      case UserListType.FOLLOWERS:
        throw UnimplementedError(
          AppLocalizations.of(context)!.comm_followersIsNotImplemented,
        );
      case UserListType.INNER_CIRCLE:
        return WildrOutlineButton.emoji(
          text: AppLocalizations.of(context)!.comm_cap_invite,
          emoji: WildrIconsPng.inner_circle,
          onPressed: () => onPressed(context),
        );
    }
  }

  @override
  Widget build(BuildContext context) => ListTile(
      title: Text(
        contactInfo.name.isNotEmpty ? contactInfo.name : contactInfo.phone,
      ),
      subtitle: contactInfo.name.isNotEmpty ? Text(contactInfo.phone) : null,
      trailing: _trailingButton(context),
    );
}
