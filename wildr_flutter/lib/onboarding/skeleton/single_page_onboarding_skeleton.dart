import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_carousel_data.dart';
import 'package:wildr_flutter/onboarding/widgets/onboarding_body.dart';

class SinglePageOnboardingSkeleton extends StatelessWidget {
  final OnboardingCarouselData onboardingCarouselData;
  final double heightPercentage;
  final bool showAppbarBackButton;
  final Widget? customAppbarLeadingButton;
  final bool shouldWrapInSafeArea;

  const SinglePageOnboardingSkeleton(
    this.onboardingCarouselData, {
    super.key,
    required this.heightPercentage,
    this.showAppbarBackButton = true,
    this.customAppbarLeadingButton,
    this.shouldWrapInSafeArea = true,
  });

  SizedBox _carouselContext() => SizedBox(
      height: Get.height * heightPercentage,
      child: OnboardingBody(onboardingCarouselData),
    );

  Widget _getButtons() {
    if (onboardingCarouselData.bigButton != null) {
      return onboardingCarouselData.bigButton!;
    } else if (onboardingCarouselData.twoBigButtons != null) {
      return onboardingCarouselData.twoBigButtons!;
    }
    return Container();
  }

  Widget _titleText() => Padding(
      padding: EdgeInsets.symmetric(
        horizontal: Get.width * 0.08,
      ),
      child: AutoSizeText(
        onboardingCarouselData.title,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w700,
        ),
        maxLines: 1,
      ),
    );

  Widget _bodyText() => Padding(
      padding: EdgeInsets.symmetric(
        horizontal: Get.width * 0.10,
      ),
      child: AutoSizeText(
        onboardingCarouselData.body,
        style: const TextStyle(color: Colors.grey),
        textAlign: TextAlign.center,
        minFontSize: 16,
        maxLines: 3,
      ),
    );

  Widget _body() => Column(
      children: [
        _carouselContext(),
        Container(height: Get.height * 0.05),
        _titleText(),
        const SizedBox(height: 10),
        _bodyText(),
        const Spacer(),
        _getButtons(),
        const Spacer(),
      ],
    );

  Widget _scaffoldBody() => _body();

  AppBar _appBar(BuildContext context) => AppBar(
      systemOverlayStyle: Theme.of(context).brightness == Brightness.dark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
      backgroundColor: Colors.transparent,
      leading: customAppbarLeadingButton ??
          (showAppbarBackButton ? null : Container()),
      elevation: 0,
    );

  @override
  Widget build(BuildContext context) => WillPopScope(
      onWillPop: () async => showAppbarBackButton,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        backgroundColor: Theme.of(context).colorScheme.background,
        appBar: _appBar(context),
        body: SafeArea(
          top: false,
          bottom: shouldWrapInSafeArea,
          child: _scaffoldBody(),
        ),
      ),
    );
}
