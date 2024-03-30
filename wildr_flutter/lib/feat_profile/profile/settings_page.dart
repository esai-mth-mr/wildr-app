import 'package:auto_route/auto_route.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flavor_config/flavor_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wildr_flutter/analytics/analytics_events.dart';
import 'package:wildr_flutter/auth/wildr_auth.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_profile/profile/user_lists/data/user_list_type.dart';
import 'package:wildr_flutter/gql_isolate_bloc/current_user_ext/current_user_events.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SettingsPage extends StatefulWidget {
  final bool shouldShowEditProfile;

  const SettingsPage({super.key, this.shouldShowEditProfile = true});

  @override
  SettingsPageState createState() => SettingsPageState();
}

class SettingsPageState extends State<SettingsPage> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  void _showLogoutFailedDialog() {
    Common().showErrorDialog(
      context,
      title: _appLocalizations.profile_signOutFailed,
      description: _appLocalizations.profile_pleaseTryAgainLater,
    );
  }

  void _debugMenu() {
    context.pushRoute(
      const DebugMenuRoute(),
    );
  }

  Widget _logoutButton() => SizedBox(
        width: MediaQuery.of(context).size.width * 0.7,
        height: MediaQuery.of(context).size.height * 0.055,
        child: ElevatedButton(
          style: ButtonStyle(
            backgroundColor:
                MaterialStateProperty.all<Color>(WildrColors.errorColor),
            shape: MaterialStateProperty.all(
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(15.0)),
            ),
          ),
          onPressed: _performLogout,
          onLongPress: () {
            if (FlavorConfig.instance.flavorName == 'dev') {
              Common().mainBloc(context).add(PerformLogoutEvent());
              Navigator.of(context).pop();
              Common().showSnackBar(
                context,
                _appLocalizations.profile_debugLogoutSuccessful,
              );
            }
          },
          child: Text(
            _appLocalizations.profile_cap_signOut,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );

  void _performLogout() {
    Common().mainBloc(context).logCustomEvent(ButtonTapEvents.kLogout);
    context.loaderOverlay.show();
    Common().mainBloc(context).add(PerformLogoutEvent());
  }

  Widget _divider() => Divider(
        color: Colors.grey[600],
        endIndent: 20,
        indent: 20,
      );

  Widget _tile(String text, Function onPressed) => ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20),
        title: Text(
          text,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w500,
          ),
        ),
        trailing: const SizedBox(
          width: 35,
          height: 35,
          child: Center(
            child: WildrIcon(
              WildrIcons.chevron_right_filled,
            ),
          ),
        ),
        onTap: () {
          onPressed();
        },
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(_appLocalizations.comm_cap_settings)),
        body: BlocListener<MainBloc, MainState>(
          listener: (context, state) {
            if (state is LogoutFailedState) {
              context.loaderOverlay.hide();
              _showLogoutFailedDialog();
            } else if (state is AppUnauthenticatedState) {
              context.loaderOverlay.hide();
              Navigator.of(context).pop();
              Common().showSnackBar(
                context,
                _appLocalizations.profile_signOutSuccessful,
              );
            }
          },
          child: SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: Scrollbar(
                    thumbVisibility: true,
                    child: ListView(
                      shrinkWrap: true,
                      //mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        const SizedBox(height: 20),
                        if (FlavorConfig.instance.flavorName == 'dev')
                          _tile('Debug Menu', _debugMenu),
                        if (FlavorConfig.instance.flavorName == 'dev')
                          _divider(),
                        if (FlavorConfig.instance.flavorName == 'dev')
                          const SizedBox(height: 40),
                        if (widget.shouldShowEditProfile)
                          _tile(
                            _appLocalizations.feed_innerCircle,
                            () => Common().mainBloc(context).add(
                                  GoToUserListEvent(UserListType.INNER_CIRCLE),
                                ),
                          ),
                        if (widget.shouldShowEditProfile) _divider(),
                        if (widget.shouldShowEditProfile)
                          _tile(_appLocalizations.profile_cap_profile,
                              () async {
                            if (FirebaseAuth.instance.currentUser == null) {
                              await WildrAuth().quickLogin(context);
                              // TODO see if you can remove it
                              await WildrAuth().getToken(
                                forceRefresh: true,
                                caller: 'quickLogin',
                              );
                            }
                            if (!mounted) return;
                            Common().mainBloc(context).add(
                                  RefreshCurrentUserDetailsEvent(
                                    Common().mainBloc(context).currentUserId,
                                  ),
                                );
                            await FirebaseAuth.instance.currentUser?.reload();
                            await context
                                .pushRoute(const EditProfilePageRoute());
                          }),
                        if (widget.shouldShowEditProfile) _divider(),
                        if (widget.shouldShowEditProfile)
                          _tile(
                            _appLocalizations.profile_postSettings,
                            () => context
                                .pushRoute(const PostSettingsPageRoute()),
                          ),
                        if (widget.shouldShowEditProfile) _divider(),
                        if (widget.shouldShowEditProfile)
                          _tile(
                            _appLocalizations.profile_contentPreferences,
                            () => context.pushRoute(
                              ContentPreferenceOnboardingPageRoute(),
                            ),
                          ),
                        if (widget.shouldShowEditProfile) _divider(),
                        _tile(
                          _appLocalizations.profile_appSettings,
                          openAppSettings,
                        ),
                        _divider(),
                        const SizedBox(height: 40),
                        _tile(
                          _appLocalizations.profile_notifications,
                          openAppSettings,
                        ),
                        _divider(),
                        _tile(
                          _appLocalizations.profile_sendUsFeedback,
                          () {
                            if (!Common()
                                .mainBloc(context)
                                .feedBackDialogOpen) {
                              Common().mainBloc(context).feedBackDialogOpen =
                                  true;
                              Common().showFeedbackBottomSheet(context);
                            }
                          },
                        ),
                        _divider(),
                        _tile(
                          _appLocalizations.profile_contactUs,
                          () => context.pushRoute(
                            const ContactUsPageRoute(),
                          ),
                        ),
                        _divider(),
                        _tile(
                          _appLocalizations.profile_cap_about,
                          () => context.pushRoute(const AboutPageRoute()),
                        ),
                        _divider(),
                        const SizedBox(height: 40),
                        SizedBox(
                          height: 30,
                          child: GestureDetector(
                            onHorizontalDragUpdate: (details) {
                              if (details.globalPosition.dx == Get.width &&
                                  details.globalPosition.dy >
                                      (Get.height * 0.9)) {
                                _debugMenu();
                              }
                            },
                            child: Container(
                              height: 50,
                              width: Get.width,
                              color: Colors.transparent,
                            ),
                          ),
                        ),
                        // SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
                if (widget.shouldShowEditProfile) _logoutButton(),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      );
}
