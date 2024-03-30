import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/widgets/dialogs/wildr_dialog_box.dart';

class ContactDialogs {
  final BuildContext context;

  const ContactDialogs(this.context);

  Future<void> showAllowAccessToContactsDialog() => showDialog(
      context: context,
      builder: (context) => WildrDialogBox.icon(
        title: AppLocalizations.of(context)!.comm_couldNotLoadUser,
        bodyText: AppLocalizations.of(context)!.comm_allowContactAccess,
        buttonText: AppLocalizations.of(context)!.comm_cap_settings,
        onPressed: () {
          Navigator.pop(context, OPEN_APP_SETTINGS);
        },
        icon: WildrIcons.contacts_outline,
      ),
    );
}
