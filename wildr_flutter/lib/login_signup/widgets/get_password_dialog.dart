import 'package:flutter/cupertino.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class GetPasswordDialog extends StatelessWidget {
  const GetPasswordDialog(this.controller, {super.key, required this.email});
  final TextEditingController controller;
  final String email;

  @override
  Widget build(BuildContext context) => Container(
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).viewInsets.bottom / 2,
        ),
        child: Center(
          child: CupertinoAlertDialog(
            title: Text('Please provide your password for\n$email'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Padding(
                  padding: const EdgeInsets.only(top: 8.0, bottom: 8.0),
                  child: CupertinoTextField(
                    autofocus: true,
                    controller: controller,
                    obscureText: true,
                    keyboardAppearance: Get.theme.brightness,
                    onSubmitted: (value) {
                      Navigator.of(context).pop();
                    },
                    style: TextStyle(color: WildrColors.textColor()),
                    placeholder:
                        AppLocalizations.of(context)!.login_signup_yourPassword,
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    CupertinoActionSheetAction(
                      isDestructiveAction: true,
                      onPressed: () {
                        debugPrint('On cancel tapped');
                        Navigator.of(context).pop();
                      },
                      child: Text(
                        AppLocalizations.of(context)!.comm_cap_cancel,
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                    CupertinoActionSheetAction(
                      isDefaultAction: true,
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      child: Text(
                        AppLocalizations.of(context)!.comm_cap_submit,
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
}
