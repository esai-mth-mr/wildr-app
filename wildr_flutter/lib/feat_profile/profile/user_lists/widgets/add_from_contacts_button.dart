import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AddFromContactsButton extends StatelessWidget {
  final UserListType userListType;

  const AddFromContactsButton(this.userListType, {super.key});

  @override
  Widget build(BuildContext context) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const WildrIcon(WildrIcons.contacts_outline),
        TextButton(
          child: Text(
            'Add from Contacts',
            style: TextStyle(color: WildrColors.textColor(context)),
          ),
          onPressed: () {
            Common().mainBloc(context).logCustomEvent(
              AnalyticsEvents.kTapAddFromContact,
              {
                AnalyticsParameters.kUserListType: userListType.name,
              },
            );
            context.pushRoute(
              ContactsPageRoute(userListType: userListType),
            );
          },
        ),
      ],
    );
}
