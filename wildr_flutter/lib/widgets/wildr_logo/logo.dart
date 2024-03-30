import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/widgets/wildr_logo/pulsating_wildr_logo.dart';

class Logo extends StatefulWidget {
  final bool shouldShowBackButton;
  final bool shouldShowSettings;
  final bool shouldPopTwice;
  final bool popResult;
  final VoidCallback? exitOnPressed;

  const Logo({
    super.key,
    this.exitOnPressed,
    this.shouldShowBackButton = true,
    this.shouldShowSettings = false,
    this.shouldPopTwice = false,
    this.popResult = true,
  });

  @override
  State<Logo> createState() => _LogoState();
}

class _LogoState extends State<Logo> {
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.only(top: 8.0, bottom: 8.0),
      child: Stack(
        children: [
          _backButton(context),
          const Align(child: PulsatingWildrLogo()),
          _settingsButton(),
        ],
      ),
    );

  Widget _backButton(BuildContext context) => (widget.shouldShowBackButton)
        ? Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              onPressed: widget.exitOnPressed ??
                  () {
                    //Navigator.of(context).pop();
                    context.popRoute(widget.popResult);
                    if (widget.shouldPopTwice) context.popRoute();
                  },
              icon: const WildrIcon(WildrIcons.x_outline),
              padding: EdgeInsets.zero,
            ),
          )
        : Container();

  Widget _settingsButton() => (widget.shouldShowSettings)
        ? Align(
            alignment: Alignment.centerRight,
            child: IconButton(
              onPressed: () => context.pushRoute(
                SettingsPageRoute(
                  shouldShowEditProfile: false,
                ),
              ),
              icon: const WildrIcon(WildrIcons.cog_filled),
              padding: EdgeInsets.zero,
            ),
          )
        : Container();
}
