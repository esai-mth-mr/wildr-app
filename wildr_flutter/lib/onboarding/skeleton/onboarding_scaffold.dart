import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';

/// A scaffold component that allows for a reusable and consistent look and feel
/// for the onboarding screens.
class OnboardingScaffold extends StatelessWidget {
  final Widget body;
  final Widget? footer;
  final Widget? appBarTitle;
  final List<Widget>? actions;
  final VoidCallback? onBackButtonPressed;
  final bool showBackButton;
  final Color? backgroundColor;
  final Color? leadingIconColor;

  const OnboardingScaffold({
    super.key,
    required this.body,
    this.footer,
    this.appBarTitle,
    this.actions,
    this.onBackButtonPressed,
    this.showBackButton = true,
    this.backgroundColor,
    this.leadingIconColor,
  });

  @override
  Widget build(BuildContext context) => ChallengesTheme(
        child: GestureDetector(
          onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
          child: Scaffold(
            backgroundColor: backgroundColor,
            appBar: AppBar(
              backgroundColor: backgroundColor,
              elevation: 0,
              shape: const Border(),
              title: appBarTitle,
              actions: actions,
              centerTitle: true,
              leading: showBackButton ? null : const SizedBox(),
              iconTheme: IconThemeData(color: leadingIconColor),
            ),
            body: WillPopScope(
              onWillPop: () {
                if (!showBackButton) return Future.value(true);
                FocusManager.instance.primaryFocus?.unfocus();
                if (onBackButtonPressed != null) {
                  onBackButtonPressed!();
                  return Future.value(false);
                }
                return Future.value(true);
              },
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(child: body),
                      if (footer != null) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: footer!,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
}
