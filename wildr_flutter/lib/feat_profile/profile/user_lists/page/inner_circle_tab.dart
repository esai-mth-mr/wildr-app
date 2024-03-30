import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/handlers/inner_circle_handler.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/services/user_list_service_locator.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/widgets/empty_user_list_add_from_contact_widget.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/widgets/user_list_smart_refresher.dart';
import 'package:wildr_flutter/gql_isolate_bloc/follow_unfollow_ext/follow_unfollow_state.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';

class InnerCircleTab extends StatefulWidget {
  final WildrUser user;
  final String currentUserId;
  final bool isCurrentUser;
  final bool isUserLoggedIn;

  const InnerCircleTab({
    required this.user,
    required this.currentUserId,
    required this.isCurrentUser,
    required this.isUserLoggedIn,
    super.key,
  });

  @override
  State<InnerCircleTab> createState() => _InnerCircleTabState();
}

class _InnerCircleTabState extends State<InnerCircleTab> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  UserListSmartRefresher _smartRefresher() => UserListSmartRefresher(
        UserListType.INNER_CIRCLE,
        user: widget.user,
        isOnCurrentUserPage: widget.isCurrentUser,
      );

  Widget _suggestionText() {
    if (userListLocator<InnerCircleHandler>(instanceName: widget.user.id)
        .isSuggestion) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 10,
            vertical: 15,
          ),
          child: AutoSizeText(
            _appLocalizations.profile_innerCircleAdditionRestrictionMessage,
            style: TextStyle(color: Colors.grey, fontSize: 12.0.sp),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            maxFontSize: 12.0.sp,
            minFontSize: 10.0.sp,
          ),
        ),
      );
    } else {
      return Container();
    }
  }

  Widget _emptyListResult(BuildContext context) => const Padding(
        padding: EdgeInsets.all(8.0),
        child: EmptyUserListAddFromContactWidget(UserListType.INNER_CIRCLE),
      );

  @override
  Widget build(BuildContext context) => widget.user.userStats.followingCount > 0
      ? BlocListener<MainBloc, MainState>(
          listener: (context, state) {
            if (state is RefreshUserListPageState) {
              if (state.id == widget.user.id) setState(() {});
            }
          },
          child: SizedBox(
            height: MediaQuery.of(context).size.height,
            child: Column(
              children: [
                _suggestionText(),
                Expanded(child: _smartRefresher()),
              ],
            ),
          ),
        )
      : _emptyListResult(context);
}
