import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_carousel_data.dart';
import 'package:wildr_flutter/onboarding/data/onboarding_getx_controller.dart';
import 'package:wildr_flutter/onboarding/widgets/onboarding_body.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/blur_gradient_overlay.dart';
import 'package:wildr_flutter/widgets/primary_cta.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class OnboardingSkeleton extends StatefulWidget {
  final double padding;
  final List<OnboardingCarouselData> onboardingCarouselData;
  final VoidCallback? onFinished;
  final double heightPercentage;
  final OnboardingGetXController? gxc;
  final bool waterfallFinish;
  final bool disableScroll;
  final bool showBackButton;

  const OnboardingSkeleton(
    this.onboardingCarouselData, {
    super.key,
    this.padding = 0,
    this.heightPercentage = 0.6,
    this.onFinished,
    this.gxc,
    this.waterfallFinish = false,
    this.disableScroll = false,
    this.showBackButton = true,
  }) : assert(!(waterfallFinish ^ (onFinished != null)));

  @override
  State<OnboardingSkeleton> createState() => _OnboardingSkeletonState();
}

class _OnboardingSkeletonState extends State<OnboardingSkeleton> {
  int index = 0;
  final PageController _controller = PageController();

  @override
  void initState() {
    widget.onboardingCarouselData.last.showNextButton = false;
    if (widget.gxc == null) Get.put(OnboardingGetXController());
    if (widget.waterfallFinish) {
      widget.onboardingCarouselData.add(OnboardingCarouselData.empty());
    }
    if (mounted) setState(() {});
    super.initState();
  }

  Widget _bodyText() => Padding(
        padding: EdgeInsets.symmetric(horizontal: Get.width * 0.08),
        child: AutoSizeText(
          widget.onboardingCarouselData[index].body,
          key: ValueKey(index),
          style: TextStyle(color: Colors.grey, fontSize: 13.0.sp),
          textAlign: TextAlign.center,
          maxLines: 2,
        ),
      );

  Widget _titleText() => Padding(
        padding: EdgeInsets.symmetric(horizontal: Get.width * 0.08),
        child: AutoSizeText(
          widget.onboardingCarouselData[index].title,
          textAlign: TextAlign.center,
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 27.0.sp),
          maxLines: 1,
          key: ValueKey(index),
        ),
      );

  Widget _getButtons() {
    if (widget.onboardingCarouselData[index].showNextButton) {
      return PrimaryCta(
        filled: true,
        text: 'Next',
        onPressed: () => _controller.nextPage(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        ),
      );
    } else if (widget.onboardingCarouselData[index].bigButton != null) {
      return widget.onboardingCarouselData[index].bigButton!;
    } else if (widget.onboardingCarouselData[index].twoBigButtons != null) {
      return widget.onboardingCarouselData[index].twoBigButtons!;
    }
    return Container();
  }

  Column _subBody() => Column(
        children: [
          SizedBox(
            height: Get.height * 0.05,
            child: SmoothPageIndicator(
              count: widget.onboardingCarouselData.length,
              effect: const ExpandingDotsEffect(
                activeDotColor: WildrColors.primaryColor,
              ),
              onDotClicked: (index) => _controller.jumpToPage(index),
              controller: _controller,
            ),
          ),
          SizedBox(
            height: Get.height * 0.11,
            child: Column(
              children: [
                _titleText(),
                _bodyText(),
              ],
            ),
          ),
          const Spacer(),
          _getButtons(),
          const Spacer(),
        ],
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Theme.of(context).colorScheme.background,
        appBar: AppBar(
          leading: widget.showBackButton ? null : Container(),
          elevation: 0,
        ),
        body: ColoredBox(
          color: Theme.of(context).colorScheme.background,
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                SingleChildScrollView(
                  child: SizedBox(
                    height: Get.height * widget.heightPercentage,
                    child: PageView(
                      physics: widget.disableScroll
                          ? const NeverScrollableScrollPhysics()
                          : null,
                      controller: _controller,
                      onPageChanged: (page) {
                        setState(() => index = page);
                        if (widget.waterfallFinish) {
                          if (page ==
                              widget.onboardingCarouselData.length - 1) {
                            widget.onFinished!();
                          }
                        }
                      },
                      children: widget.onboardingCarouselData
                          .map(
                            (r) => r.addBlur
                                ? BlurGradientOverlay(child: OnboardingBody(r))
                                : OnboardingBody(r),
                          )
                          .toList(),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: widget.onboardingCarouselData[index].childSubBody ??
                        _subBody(),
                  ),
                ),
              ],
            ),
          ),
        ),
      );

  @override
  void dispose() {
    Get.find<OnboardingGetXController>().skipped = false;
    super.dispose();
  }
}
