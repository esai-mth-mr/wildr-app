import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/dialogs/confirmation_dialog.dart';
import 'package:wildr_flutter/feat_profile/profile/gc_user_profile.dart';
import 'package:wildr_flutter/feat_profile/profile/profile_page_commons.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class DeleteUserPage extends StatelessWidget {
  const DeleteUserPage({super.key});

  Widget _profileImage() {
    late final CurrentUserProfileGxC profileGxC =
        Get.find(tag: CURRENT_USER_TAG);
    return Center(
      child: ProfilePageCommon().profileImageCircleAvatar(profileGxC.user),
    );
  }

  Future _showDialog(BuildContext context) => showDialog(
        useRootNavigator: true,
        context: context,
        builder: (context) => CustomDialogBox(
          logo: const DeleteLogo(),
          title: AppLocalizations.of(context)!.profile_deletingYourAccount,
          description:
              AppLocalizations.of(context)!.profile_deleteAccountConfirmPrompt,
          leftButtonText: AppLocalizations.of(context)!.comm_cap_no,
          leftButtonColor: WildrColors.errorColor,
          leftButtonOnPressed: () {
            Navigator.of(context).pop();
          },
          rightButtonText: AppLocalizations.of(context)!.comm_cap_yes,
          rightButtonColor: WildrColors.errorColor,
          rightButtonOnPressed: () {
            Common().mainBloc(context).add(RequestDeleteEvent());
            context.loaderOverlay.show();
          },
        ),
      );

  void _performDelete(BuildContext context) {
    _showDialog(context);
  }

  Widget _deleteButton(BuildContext context) => InkWell(
        onTap: () => _performDelete(context),
        child: Text(
          AppLocalizations.of(context)!.profile_cap_confirm,
          style:
              const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: Common().appbarWithActions(
          title: AppLocalizations.of(context)!.profile_deleteUser,
        ),
        body: BlocListener<MainBloc, MainState>(
          listener: (context, state) {
            if (state is RequestDeleteUserState) {
              if (state.errorMessage != null) {
                Common().showErrorSnackBar(kSomethingWentWrong, context);
              } else {
                Common().showSnackBar(
                  context,
                  AppLocalizations.of(context)!
                      .profile_willNotifyOnceYourAccountIsDeleted,
                );
                Common().mainBloc(context).add(PerformLogoutEvent());
              }
            }
            if (state is LogoutFailedState) {
              context.loaderOverlay.hide();
            } else if (state is AppUnauthenticatedState) {
              context.loaderOverlay.hide();
              Navigator.of(context).pop();
              Navigator.of(context).pop();
              Navigator.of(context).pop();
              Common().showSnackBar(
                context,
                AppLocalizations.of(context)!.profile_signOutSuccessful,
              );
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(50.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  children: [
                    _profileImage(),
                    const SizedBox(height: 20),
                    Text(
                      AppLocalizations.of(context)!.profile_areYouSure,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'This action cannot be undone. Your account will be '
                      'permanently deleted including posts, comments '
                      'and reactions.',
                      style: TextStyle(fontSize: 16),
                    ),
                    const SizedBox(
                      height: 20,
                    ),
                    Text(
                      AppLocalizations.of(context)!
                          .profile_willNotifyOnceYourAccountIsDeleted,
                    ),
                  ],
                ),
                _deleteButton(context),
              ],
            ),
          ),
        ),
      );
}
