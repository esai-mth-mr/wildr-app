import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/login_signup/enum_login_type.dart';

class LoginButton extends StatelessWidget {
  final VoidCallback performLogin;
  final bool isSignUp;
  final LoginType loginType;
  final VoidCallback debugLogin;

  const LoginButton({
    super.key,
    required this.performLogin,
    required this.isSignUp,
    required this.loginType,
    required this.debugLogin,
  });

  @override
  Widget build(BuildContext context) => Container(
      width: MediaQuery.of(context).size.width,
      margin: EdgeInsets.only(
        left: Get.width * 0.15,
        right: Get.width * 0.15,
        top: Get.height * 0.02,
      ),
      child: OutlinedButton(
        style: ButtonStyle(
          shape: MaterialStateProperty.all(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(22.0),
            ),
          ),
        ),
        onPressed: performLogin,
        onLongPress: debugLogin,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: SizedBox(
            height: Get.height * 0.03,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                loginType.getIcon(
                  color: Get.theme.brightness == Brightness.dark
                      ? Colors.white
                      : Colors.black,
                ),
                Text(
                  isSignUp
                      ? loginType.toSignUpString()
                      : loginType.toSignInString(),
                  style: TextStyle(
                    color: Get.theme.brightness == Brightness.dark
                        ? Colors.white
                        : Colors.black,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Container(),
              ],
            ),
          ),
        ),
      ),
    );
}
