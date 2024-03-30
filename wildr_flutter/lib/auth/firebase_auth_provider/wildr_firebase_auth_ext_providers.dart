part of 'wildr_firebase_auth.dart';

extension WildrFirebaseAuthProviders on WildrFirebaseAuth {
  int getProviderIdIndex(LoginType providerId) =>
      FirebaseAuth.instance.currentUser == null
          ? -1
          : FirebaseAuth.instance.currentUser!.providerData.indexWhere(
              (i) => i.providerId == providerId.parseToProviderId(),
            );

  UserInfo? getProvider(LoginType loginType) =>
      FirebaseAuth.instance.currentUser == null
          ? null
          : FirebaseAuth.instance.currentUser!.providerData
              .firstWhere((i) => i.providerId == loginType.parseToProviderId());

  List<LoginType> getAllProviderTypes() =>
      FirebaseAuth.instance.currentUser!.providerData
          .map((e) => providerIdToLoginType(e.providerId))
          .toList();

  LoginType getEasiestLogin() {
    if (Platform.isAndroid) {
      if (checkIfProviderExists(LoginType.GOOGLE)) {
        return LoginType.GOOGLE;
      } else if (checkIfProviderExists(LoginType.EMAIL)) {
        return LoginType.EMAIL;
      } else {
        return getFirstProviderId();
      }
    } else if (Platform.isIOS) {
      if (checkIfProviderExists(LoginType.APPLE)) {
        return LoginType.APPLE;
      } else if (checkIfProviderExists(LoginType.GOOGLE)) {
        return LoginType.GOOGLE;
      } else if (checkIfProviderExists(LoginType.EMAIL)) {
        return LoginType.EMAIL;
      } else {
        return getFirstProviderId();
      }
    } else {
      throw UnimplementedError();
    }
  }

  LoginType getFirstProviderId() => providerIdToLoginType(
        FirebaseAuth.instance.currentUser!.providerData[0].providerId,
      );

  LoginType providerIdToLoginType(String providerId) {
    switch (providerId) {
      case 'password':
        return LoginType.EMAIL;
      case 'phone':
        return LoginType.PHONE;
      case 'google.com':
        return LoginType.GOOGLE;
      case 'apple.com':
        return LoginType.APPLE;
      default:
        throw UnimplementedError();
    }
  }

  bool checkIfProviderExists(LoginType loginType) =>
      getProviderIdIndex(loginType) != -1;
}
