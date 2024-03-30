import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class CustomDialogBox extends StatefulWidget {
  final String? title;
  final String? description;
  final String? questionText;
  final String? leftButtonText;
  final String? rightButtonText;
  final String? centerButtonText;
  final VoidCallback? leftButtonOnPressed;
  final VoidCallback? rightButtonOnPressed;
  final VoidCallback? centerButtonOnPressed;
  final Color? leftButtonColor;
  final Color? rightButtonColor;
  final Color? centerButtonColor;
  final Color? descriptionColor;
  final Widget? logo;
  final bool isLeftButtonSolid;
  final bool isRightButtonSolid;
  final double? width;
  final VoidCallback? onExitPressed;

  const CustomDialogBox({
    super.key,
    this.title,
    this.description,
    this.descriptionColor,
    this.questionText,
    this.logo,
    this.leftButtonText,
    this.rightButtonText,
    this.centerButtonText,
    this.leftButtonOnPressed,
    this.rightButtonOnPressed,
    this.centerButtonOnPressed,
    this.leftButtonColor = WildrColors.primaryColor,
    this.rightButtonColor = WildrColors.primaryColor,
    this.centerButtonColor = WildrColors.primaryColor,
    this.isLeftButtonSolid = false,
    this.isRightButtonSolid = true,
    this.width,
    this.onExitPressed,
  });

  @override
  State<CustomDialogBox> createState() => _CustomDialogBoxState();
}

class _CustomDialogBoxState extends State<CustomDialogBox> {
  final double _padding = 20;

  BoxDecoration _decoration() => BoxDecoration(
        color: Theme.of(context).colorScheme.background,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            offset: Offset(0, 10),
            blurRadius: 10,
          ),
        ],
      );

  Widget _logo() => Stack(
        children: [
          Center(
            child: widget.logo!,
          ),
          Align(
            alignment: Alignment.topRight,
            child: IconButton(
              padding: EdgeInsets.zero,
              icon: const WildrIcon(WildrIcons.x_outline),
              onPressed: widget.onExitPressed ??
                  () {
                    Navigator.of(context).pop(true);
                  },
            ),
          ),
        ],
      );

  Widget _title() => Padding(
        padding: const EdgeInsets.only(bottom: 15),
        child: Text(
          widget.title!,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
        ),
      );

  Widget _description() => Text(
        widget.description!,
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: widget.descriptionColor ?? WildrColors.textColor(),
        ),
        textAlign: TextAlign.center,
      );

  Widget _questionText() => Padding(
        padding: const EdgeInsets.only(top: 20.0),
        child: Text(
          widget.questionText!,
          style: const TextStyle(fontSize: 14),
          textAlign: TextAlign.center,
        ),
      );

  Widget _leftAndRightButton() => Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Expanded(
            child: TextButton(
              style: Common().buttonStyle(
                isFilled: widget.isLeftButtonSolid,
                color: widget.leftButtonColor,
              ),
              onPressed: widget.leftButtonOnPressed,
              child: Text(
                widget.leftButtonText!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: widget.isLeftButtonSolid
                      ? Colors.white
                      : widget.leftButtonColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const Padding(padding: EdgeInsets.symmetric(horizontal: 10)),
          Expanded(
            child: TextButton(
              style: Common().buttonStyle(
                radius: 25.0,
                color: widget.rightButtonColor,
                isFilled: widget.isRightButtonSolid,
              ),
              onPressed: widget.rightButtonOnPressed,
              child: Text(
                widget.rightButtonText!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: widget.isRightButtonSolid
                      ? Colors.white
                      : widget.rightButtonColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
              // onPressed: () {},
            ),
          ),
        ],
      );

  Widget _centerButton() => TextButton(
        style: Common().buttonStyle(
          radius: 25.0,
          color: widget.centerButtonColor,
        ),
        onPressed: widget.centerButtonOnPressed ??
            widget.onExitPressed ??
            () {
              Navigator.of(context).pop(true);
            },
        child: Text(
          widget.centerButtonText!,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        // onPressed: () {},
      );

  Widget _buttons() {
    if ((widget.leftButtonText != null || widget.rightButtonText != null) &&
        widget.centerButtonText != null) {
      throw Exception(
        "Can't have both left or right button"
        ' and a center button, please choose one',
      );
    }
    if (widget.leftButtonText != null && widget.rightButtonText != null) {
      return _leftAndRightButton();
    }
    if (widget.centerButtonText != null) {
      return _centerButton();
    }
    return const SizedBox.shrink();
  }

  Widget _content() => Container(
        padding: EdgeInsets.only(
          left: _padding,
          right: _padding,
          bottom: _padding,
          top: widget.logo == null ? _padding : 0,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            if (widget.title != null) _title(),
            if (widget.description != null) _description(),
            if (widget.questionText != null) _questionText(),
            const SizedBox(
              height: 22,
            ),
            _buttons(),
          ],
        ),
      );

  Container _contentBox(context) => Container(
        width: widget.width,
        decoration: _decoration(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.logo != null) _logo(),
            _content(),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_padding),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
        child: _contentBox(context),
      );
}

class DeleteLogo extends StatelessWidget {
  const DeleteLogo({super.key});

  @override
  Widget build(BuildContext context) => Container(
        width: Get.width * 0.2,
        height: Get.width * 0.3,
        decoration: const BoxDecoration(
          color: WildrColors.errorColor,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: WildrIcon(
            WildrIcons.trash_filled,
            color: Colors.white,
            size: Get.width * 0.11,
          ),
        ),
      );
}

class AttentionLogo extends StatelessWidget {
  final Color color;

  const AttentionLogo({super.key, this.color = Colors.orange});

  @override
  Widget build(BuildContext context) => Container(
        width: Get.width * 0.2,
        height: Get.width * 0.3,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Center(
          child: FaIcon(
            FontAwesomeIcons.exclamation,
            color: Colors.white,
            size: Get.width * 0.11,
          ),
        ),
      );
}

class QuestionLogo extends StatelessWidget {
  const QuestionLogo({super.key});

  @override
  Widget build(BuildContext context) => Container(
        width: Get.width * 0.2,
        height: Get.width * 0.3,
        decoration:
            const BoxDecoration(color: Colors.orange, shape: BoxShape.circle),
        child: Center(
          child: FaIcon(
            FontAwesomeIcons.question,
            color: Colors.white,
            size: Get.width * 0.11,
          ),
        ),
      );
}

class SuccessLogo extends StatelessWidget {
  const SuccessLogo({super.key});

  @override
  Widget build(BuildContext context) => Container(
        width: Get.width * 0.2,
        height: Get.width * 0.3,
        decoration: const BoxDecoration(
          color: WildrColors.primaryColor,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: WildrIcon(
            WildrIcons.check_filled,
            color: Colors.white,
            size: Get.width * 0.11,
          ),
        ),
      );
}

class ErrorLogo extends StatelessWidget {
  const ErrorLogo({super.key});

  @override
  Widget build(BuildContext context) => Container(
        width: Get.width * 0.2,
        height: Get.width * 0.3,
        decoration: const BoxDecoration(
          color: WildrColors.errorColor,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: WildrIcon(
            WildrIcons.x_outline,
            color: Colors.white,
            size: Get.width * 0.11,
          ),
        ),
      );
}

class CloseLogo extends StatelessWidget {
  const CloseLogo({super.key});

  @override
  Widget build(BuildContext context) => Container(
        width: Get.width * 0.2,
        height: Get.width * 0.3,
        decoration: const BoxDecoration(
          color: WildrColors.errorColor,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: WildrIcon(
            WildrIcons.closeIcon,
            color: Colors.white,
            size: Get.width * 0.11,
          ),
        ),
      );
}
