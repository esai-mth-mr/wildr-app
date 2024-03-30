import 'package:auto_route/auto_route.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/material.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/gql_isolate_bloc/feature_flags_config/feature_flags_config.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

class DebugMenuActions {
  String name;
  VoidCallback onTap;

  DebugMenuActions({required this.name, required this.onTap});
}

class DebugMenu extends StatefulWidget {
  const DebugMenu({super.key});

  @override
  State<DebugMenu> createState() => _DebugMenuState();
}

class _DebugMenuState extends State<DebugMenu> {
  @override
  Widget build(BuildContext context) {
    final List<DebugMenuActions> menus = [
      DebugMenuActions(
        name: 'Wildr Verified',
        onTap: () {
          //TODO: Push the user to WildrVerified
          context.pushRoute(const WildrVerifyIntroPageRoute());
        },
      ),
      DebugMenuActions(
        name: 'Crash app',
        onTap: () {
          FirebaseCrashlytics.instance.crash();
        },
      ),
      DebugMenuActions(
        name: 'Show Close Friend page',
        onTap: () => context.pushRoute(
          const OnboardingInnerCircleRoute(),
        ),
      ),
      DebugMenuActions(
        name: 'Challenges onboarding',
        onTap: () => context.pushRoute(
          ChallengesOnboardingPageRoute(
            showBackButton: true,
          ),
        ),
      ),
      DebugMenuActions(
        name: 'Waitlist dashboard',
        onTap: () => context.pushRoute(
          const WalletWaitlistDashboardPageRoute(),
        ),
      ),
      DebugMenuActions(
        name: 'Open App Update dialog',
        onTap: () => Common().showAppUpdateDialog(context),
      ),
      DebugMenuActions(
        name: 'Clear preferences',
        onTap: () async {
          context.loaderOverlay.show();
          await Prefs.clear();
          context.loaderOverlay.hide();
          Common().showSnackBar(context, 'Cleared preferences');
        },
      ),
    ];

    return Scaffold(
      appBar: Common().appbarWithActions(title: 'Debug Menu'),
      body: ListView(
        children: [
          ...menus
              .map(
                (i) => ListTile(
                  title: Text(i.name),
                  onTap: i.onTap,
                ),
              )
              .toList(),
          ListTile(
            title: const Text('Create Post v2'),
            trailing: Switch(
              value: Common().mainBloc(context).featureFlagsConfig.createPostV2,
              onChanged: (newValue) async {
// Change the values of createPostV1 and createPostV2
                final jsonMap = {
                  'createPostV1': !newValue,
                  'createPostV2': newValue,
                };

                Common().mainBloc(context).featureFlagsConfig =
                    FeatureFlagsConfig.fromJson(jsonMap);

// Save the updated values to shared preferences
                Common().mainBloc(context).featureFlagsConfig.saveToPrefs();
                setState(() {});
              },
            ),
          ),
        ],
      ),
    );
  }
}
