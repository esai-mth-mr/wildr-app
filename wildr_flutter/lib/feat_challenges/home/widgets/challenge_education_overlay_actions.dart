import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:overlay_tooltip/overlay_tooltip.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/widgets/challenges_theme.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class ChallengeEducationOverlayActions extends StatefulWidget {
  final TooltipController tooltipController;

  const ChallengeEducationOverlayActions({
    super.key,
    required this.tooltipController,
  });

  @override
  State<ChallengeEducationOverlayActions> createState() =>
      _ChallengeEducationOverlayActionsState();
}

class _ChallengeEducationOverlayActionsState
    extends State<ChallengeEducationOverlayActions> {
  double opacityLevel = 0.0;

  void _fadeIn() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {
        opacityLevel = 1.0;
      });
    });
  }

  @override
  void initState() {
    super.initState();
    _fadeIn();
  }

  @override
  Widget build(BuildContext context) {
    final Color overlayColor =
        ChallengesStyles.of(context).scaffoldBackgroundColor;

    final Widget overlayBackground = Container(
      height: widget.tooltipController.nextPlayIndex == 1
          ? MediaQuery.of(context).size.height * 0.5
          : null,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            overlayColor.withOpacity(0.9),
            overlayColor.withOpacity(0.9),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
    );

    final closeButton = SafeArea(
      child: Padding(
        padding: const EdgeInsets.only(left: 12, top: 4),
        child: IconButton(
          padding: EdgeInsets.zero,
          onPressed: widget.tooltipController.dismiss,
          icon: CircleAvatar(
            backgroundColor: ChallengesStyles.of(context).backgroundColor,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: WildrIcon(
                WildrIcons.x_filled,
                color: ChallengesStyles.of(context).mutedTextColor,
              ),
            ),
          ),
        ),
      ),
    );

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 500),
      curve: Curves.decelerate,
      opacity: opacityLevel,
      child: Stack(
        children: [
          overlayBackground,
          Align(
            alignment: Alignment.topLeft,
            child: closeButton,
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: _BottomRowActions(
              tooltipController: widget.tooltipController,
              onBackPressed: () => setState(() {}),
              onNextPressed: () => setState(() {}),
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomRowActions extends StatelessWidget {
  final TooltipController tooltipController;
  final VoidCallback onBackPressed;
  final VoidCallback onNextPressed;

  const _BottomRowActions({
    required this.tooltipController,
    required this.onBackPressed,
    required this.onNextPressed,
  });

  @override
  Widget build(BuildContext context) {
    final Color overlayColor =
        ChallengesStyles.of(context).scaffoldBackgroundColor;

    final pageIndicatorController = PageController(
      initialPage: tooltipController.nextPlayIndex,
    );

    final pageIndicator = SmoothPageIndicator(
      controller: pageIndicatorController,
      count: 3,
      effect: ExpandingDotsEffect(
        activeDotColor: ChallengesStyles.of(context).primaryTextColor,
        dotColor: WildrColors.gray900,
        dotHeight: 8,
      ),
    );

    final backButton = PrimaryCta(
      text: AppLocalizations.of(context)!.comm_cap_back,
      onPressed: () {
        pageIndicatorController.dispose();
        tooltipController.previous();
        onBackPressed();
      },
    );

    final nextButton = PrimaryCta(
      text: tooltipController.nextPlayIndex ==
              tooltipController.playWidgetLength - 1
          ? AppLocalizations.of(context)!.comm_cap_done
          : AppLocalizations.of(context)!.comm_cap_next,
      outline: true,
      onPressed: () {
        pageIndicatorController.dispose();
        tooltipController.next();
        onNextPressed();
      },
    );

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            overlayColor.withOpacity(0),
            overlayColor,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          stops: const [
            0.0,
            0.7,
          ],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 64, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            pageIndicator,
            const SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (tooltipController.nextPlayIndex != 0) backButton,
                const Spacer(),
                nextButton,
              ],
            ),
          ],
        ),
      ),
    );
  }
}
