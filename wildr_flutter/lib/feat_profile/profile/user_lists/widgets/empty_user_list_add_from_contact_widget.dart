import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/buttons/big_button.dart';

class EmptyUserListAddFromContactWidget extends StatelessWidget {
  final UserListType userListType;

  const EmptyUserListAddFromContactWidget(this.userListType, {super.key});

  @override
  Widget build(BuildContext context) => Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            userListType.getEmptyListAddFromContactsString(),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 20),
          BigButton.icon(
            text: AppLocalizations.of(context)!.profile_addFromContacts,
            onPressed: () => context.pushRoute(
              ContactsPageRoute(userListType: userListType),
            ),
            icon: WildrIcons.contacts_outline,
          ),
        ],
      );
}
