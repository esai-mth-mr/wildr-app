import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icon_png.dart';
import 'package:wildr_flutter/common/wildr_emojis/wildr_icons_png.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/list_visibility.dart';
import 'package:wildr_flutter/feat_profile/profile/edit_details/data/user_list_visibility_actions.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/inner_circles_ext/inner_circle_events.dart';
import 'package:wildr_flutter/gql_isolate_bloc/profile_page_ext/profile_page_event.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/basic_one_button_bottom_sheet.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/multi_button_bottom_sheet.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ProfilePageBottomSheets {
  final BuildContext context;
  final String? userId;

  const ProfilePageBottomSheets(this.context, {this.userId});

  void _showModalBottomSheet({
    required WidgetBuilder builder,
    VoidCallback? whenComplete,
  }) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10.0),
      ),
      backgroundColor: Colors.transparent,
      builder: builder,
    ).whenComplete(() {
      if (whenComplete != null) {
        whenComplete();
      }
    });
  }

  void following({
    required VoidCallback unfollowCTA,
    required VoidCallback addToCircleCTA,
  }) {
    if (userId == null) throw Exception('userId must not be null');
    _showModalBottomSheet(
      builder: (context) => MultiButtonBottomSheet([
        MultiButtonBottomSheetData(
          leadingIcon: WildrIconPng(
            WildrIconsPng.inner_circle,
            size: 18.0.w,
          ),
          text: AppLocalizations.of(context)!.profile_addToInnerCircle,
          onPressed: () {
            addToCircleCTA();
            Common()
                .mainBloc(context)
                .add(ICAddMemberEvent(userId!, index: -1));
            Navigator.pop(context);
          },
        ),
        MultiButtonBottomSheetData(
          leadingIcon: WildrIconPng(
            WildrIconsPng.red_x,
            size: 18.0.w,
          ),
          text: AppLocalizations.of(context)!.profile_cap_unfollow,
          onPressed: () {
            unfollowCTA();
            Common().mainBloc(context).add(UnfollowUserEvent(userId!));
            Navigator.pop(context);
          },
        ),
      ]),
    );
  }

  void innerCircle({
    required VoidCallback unfollowCTA,
    required VoidCallback cbRemoveFromIC,
  }) {
    if (userId == null) throw Exception('userId must not be null');
    _showModalBottomSheet(
      builder: (context) => MultiButtonBottomSheet([
        MultiButtonBottomSheetData(
          leadingIcon: WildrIconPng(
            WildrIconsPng.red_x,
            size: 18.0.w,
          ),
          text: AppLocalizations.of(context)!.profile_removeFromInnerCircle,
          onPressed: () {
            cbRemoveFromIC();
            Common()
                .mainBloc(context)
                .add(ICRemoveMemberEvent(userId!, index: -1));
            Navigator.pop(context);
          },
        ),
        MultiButtonBottomSheetData(
          leadingIcon: WildrIconPng(
            WildrIconsPng.red_x,
            size: 18.0.w,
          ),
          text: AppLocalizations.of(context)!.profile_cap_unfollow,
          onPressed: () {
            unfollowCTA();
            Common().mainBloc(context).add(UnfollowUserEvent(userId!));
            Navigator.pop(context);
          },
        ),
      ]),
    );
  }

  void updateListVisibility(
    UserListVisibilityActions action,
    ListVisibility listVisibility,
  ) {
    _showModalBottomSheet(
      builder: (context) => BasicOneButtonBottomSheet(
        title: action.toBottomSheetTitle(context),
        body: action.toBottomSheetBody(context),
        onPressed: () {
          context.loaderOverlay.show();
          Common()
              .mainBloc(context)
              .add(UpdateListVisibilityEvent(listVisibility));
          Navigator.pop(context);
        },
      ),
    );
  }

  void invite({
    required VoidCallback inviteToWildrCallback,
    required VoidCallback inviteToInnerCircleCallback,
    VoidCallback? onComplete,
  }) {
    final inviteToIC = MultiButtonBottomSheetData(
      leadingIcon: WildrIconPng(
        WildrIconsPng.inner_circle,
        size: 18.0.w,
      ),
      text: AppLocalizations.of(context)!.profile_inviteToInnerCircle,
      onPressed: () {
        Navigator.pop(context);
        inviteToInnerCircleCallback();
      },
    );

    final inviteToWildr = MultiButtonBottomSheetData(
      leadingIcon: WildrIcon(
        WildrIcons.wildr_filled,
        size: 20.0.w,
        color: WildrColors.primaryColor,
      ),
      text: AppLocalizations.of(context)!.profile_inviteToWildr,
      onPressed: () {
        Navigator.pop(context);
        inviteToWildrCallback();
      },
    );
    _showModalBottomSheet(
      builder: (context) => MultiButtonBottomSheet([
        inviteToIC,
        inviteToWildr,
      ]),
      whenComplete: onComplete,
    );
  }
}
