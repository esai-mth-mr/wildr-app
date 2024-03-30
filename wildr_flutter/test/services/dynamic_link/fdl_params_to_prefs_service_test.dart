import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/services/dynamic_link/fdl_params_to_prefs_service.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

import 'dynamic_link_testing_constants.dart';

class _MockFirebaseDynamicLinks extends Mock implements FirebaseDynamicLinks {}

void main() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  group('Dynamic Link Parsing', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      await Prefs.init();
    });

    tearDown(() async => await Prefs.clear());

    test('A Post dynamic link shall record the details to Preferences',
        () async {
      // GIVEN
      const intentTypeToTest = HomePageIntentType.POST;
      final mockFirebaseDynamicLinks = _MockFirebaseDynamicLinks();
      final FDLParamsToPrefsService fdlParamsToPrefsService =
          FDLParamsToPrefsService();
      when(mockFirebaseDynamicLinks.getInitialLink).thenAnswer(
        (_) async => PendingDynamicLinkData(
          link: Uri.parse(
            DLTestingConstants.intentTypeToDynamicLinkMap[intentTypeToTest]!,
          ),
        ),
      );

      // WHEN
      final initialLink = await mockFirebaseDynamicLinks.getInitialLink();
      if (initialLink == null) fail('initialLink is null');
      fdlParamsToPrefsService.handleParams(initialLink.link);

      // THEN
      expect(
        Prefs.getString(PrefKeys.kReferrerHandle),
        DLTestingConstants.kReferrerHandle,
      );
      expect(
        Prefs.getString(PrefKeys.kReferrerId),
        DLTestingConstants.kReferrerId,
      );
      expect(Prefs.getString(PrefKeys.kReferralName), null);
      expect(Prefs.getString(PrefKeys.kReferralOrInviteCode), null);
    });
  });
}
