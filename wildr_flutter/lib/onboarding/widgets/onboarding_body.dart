import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:lottie/lottie.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_carousel_data.dart';

class OnboardingBody extends StatelessWidget {
  final OnboardingCarouselData onboardingCarouselData;

  const OnboardingBody(this.onboardingCarouselData, {super.key});

  Widget _getBody() {
    switch (onboardingCarouselData.onboardingBodyType) {
      case OnboardingBodyType.LOTTIE:
        return Lottie.asset(
          onboardingCarouselData.lottieSrc!,
          repeat: onboardingCarouselData.loop,
        );
      case OnboardingBodyType.IMAGE:
        return Image.asset(
          onboardingCarouselData.imageSrc!,
          fit: onboardingCarouselData.boxFit,
        );
      case OnboardingBodyType.SVG:
        return SvgPicture.asset(
          onboardingCarouselData.imageSrc!,
          fit: onboardingCarouselData.boxFit ?? BoxFit.contain,
        );
      case OnboardingBodyType.CHILD:
        return onboardingCarouselData.child!;
      case OnboardingBodyType.EMPTY:
        return Container();
    }
  }

  @override
  Widget build(BuildContext context) => _getBody();
}
