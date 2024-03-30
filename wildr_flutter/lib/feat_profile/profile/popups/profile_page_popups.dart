import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/widgets/dialogs/wildr_dialog_box.dart';

class ProfilePagePopups {
  final BuildContext context;

  const ProfilePagePopups(this.context);

  String _getRestrictedListTitleText(type) =>
      '$type list view has been restricted';

  String _getRestrictedListBodyText(type) =>
      'Users can choose to restrict visibility of who they follow and their '
      '$type. Go to your Profile > Settings > Profile';

  void showRestrictedList(UserListType userListType) {
    showDialog(
      context: context,
      builder: (context) => WildrDialogBox.icon(
        title: _getRestrictedListTitleText(userListType.toViewString()),
        bodyText: _getRestrictedListBodyText(
          userListType.toViewString().toLowerCase(),
        ),
        buttonText: AppLocalizations.of(context)!.comm_cap_done,
        onPressed: () => Navigator.pop(context),
        icon: WildrIcons.lock_closed_filled,
      ),
    );
  }
}
