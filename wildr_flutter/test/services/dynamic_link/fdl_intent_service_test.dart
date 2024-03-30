import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/services/dynamic_link/fdl_intent_service.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';

import '../../helper/test_configure_flavor.dart';
import 'dynamic_link_testing_constants.dart';

class _MockFirebaseDynamicLinks extends Mock implements FirebaseDynamicLinks {}

void main() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  group('Dynamic Link Parsing', () {
    setUp(() async {
      await TestConfigureFlavor.configureFlavor();
      SharedPreferences.setMockInitialValues({});
      await Prefs.init();
    });

    tearDown(() async => await Prefs.clear());

    test('A Post dynamic link should create an Intent with post details',
        () async {
      // GIVEN
      const intentTypeToTest = HomePageIntentType.POST;
      final mockFirebaseDynamicLinks = _MockFirebaseDynamicLinks();
      final intentService = FDLIntentService();

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

      final HomePageIntent? intent = intentService.prepareIntent(initialLink);
      if (intent == null) fail('intent is null');

      // THEN
      expect(intent.type, intentTypeToTest);
      expect(intent.objectId?.postId, DLTestingConstants.kPostId);
    });
  });
}
