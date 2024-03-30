import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/basic_one_button_bottom_sheet.dart';

class UserListBottomSheets {
  final BuildContext context;

  const UserListBottomSheets(this.context);

  void removeFollower({
    required String handle,
    required VoidCallback onPressed,
  }) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10.0),
      ),
      builder: (context) => BasicOneButtonBottomSheet(
        title: AppLocalizations.of(context)!.profile_removeFollower,
        body: '@$handle will no longer be able'
            ' to see all your'
            " posts and won't be notified they were removed.",
        onPressed: onPressed,
      ),
    );
  }

  void removeInnerCircleUser({
    required String handle,
    required VoidCallback onPressed,
  }) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10.0),
      ),
      builder: (context) => BasicOneButtonBottomSheet(
        title: AppLocalizations.of(context)!.profile_removeFromInnerCircle,
        body: '@$handle will no longer be able to see your'
            ' Inner Circle posts and won’t be notified they were removed.',
        onPressed: onPressed,
      ),
    );
  }
}
