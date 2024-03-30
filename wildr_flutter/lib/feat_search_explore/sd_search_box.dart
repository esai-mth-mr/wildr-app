import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SDSearchBox extends StatelessWidget {
  final TextEditingController? controller;
  final String placeholder;
  final FocusNode? focusNode;

  const SDSearchBox({
    required this.placeholder,
    this.controller,
    this.focusNode,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final Color smartColor = Theme.of(context).brightness == Brightness.dark
        ? Colors.white70
        : Colors.black54;
    late final Widget prefix = Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(6, 0, 0, 0),
      child: WildrIcon(WildrIcons.search_outline, color: smartColor),
    );

    late final Widget suffix = Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(0, 0, 5, 0),
      child: CupertinoButton(
        onPressed: () {
          controller?.text = '';
        },
        minSize: 0,
        padding: EdgeInsets.zero,
        child: WildrIcon(WildrIcons.x_circle_filled, color: smartColor),
      ),
    );
    return CupertinoTextField(
      controller: controller,
      prefix: prefix,
      autocorrect: false,
      focusNode: focusNode,
      suffix: suffix,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      style: TextStyle(color: WildrColors.textColor()),
      textInputAction: TextInputAction.done,
      placeholder: placeholder,
      suffixMode: OverlayVisibilityMode.editing,
      decoration: BoxDecoration(
        border: Border.all(color: smartColor),
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}
