// ignore_for_file: always_declare_return_types

part of 'wildr_firebase_auth.dart';

extension WildrFirebaseAuthEmail on WildrFirebaseAuth {
  bool isEmailVerified() =>
      FirebaseAuth.instance.currentUser?.emailVerified ?? false;

  String? getEmailAddressFromLoginType(LoginType type) =>
      getProvider(type)?.email;

  String? getVerifiedEmail() {
    for (final LoginType i in [LoginType.GOOGLE, LoginType.APPLE]) {
      if (checkIfProviderExists(i)) {
        final String? email = getEmailAddressFromLoginType(i);
        if (FirebaseAuth.instance.currentUser!.email == email) {
          return null;
        }
        return email;
      }
    }
    return null;
  }

  Future<void> switchEmailToVerifiedEmailIfPossible() async {
    final String? email = getVerifiedEmail();
    if (email != null) {
      await FirebaseAuth.instance.currentUser?.updateEmail(email);
    }
  }

  bool hasOnlyPhoneNumberProvider() {
    final types = getAllProviderTypes();
    return types.length == 1 && types.first == LoginType.PHONE;
  }

  bool isEmailProviderButNotVerified() =>
      !(FirebaseAuth.instance.currentUser?.emailVerified ?? false) &&
      FirebaseAuth.instance.currentUser?.email != null;
}
