import 'dart:convert';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/reposts/reposts_list_page.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/repost_state.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/widgets/styling/app_theme_data.dart';

class MockMainBloc extends MockBloc<MainBlocEvent, MainState>
    implements MainBloc {}

void main() {
  final mainBloc = MockMainBloc();

  // Author json string
  const authorJsonString = '''
  {
    "__typename": "User",
    "id": "fakeId",
    "handle": "post_author",
    "name": "OG Author"
  }''';
  const authorPlaceholderJsonString = '''
  {
    "__typename": "User",
    "id": "u4fQ7DyB5w0zR3P3",
    "handle": "author_placeholder",
    "name": "author_placeholder"
  }''';

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadAppFonts();
  });

  testGoldens('RepostsListPage no reposts', (WidgetTester tester) async {
    // GIVEN
    final author = Author.fromJson(json.decode(authorJsonString));
    final post = Post.empty()
      ..bodyText = 'post body'
      ..author = author;

    whenListen(
      mainBloc,
      Stream.value(
        PaginateRepostedPostsState(),
      ),
      initialState: PaginateRepostedPostsState(),
    );

    // WHEN
    await tester.pumpWidget(
      MaterialApp(
        theme: AppThemesData.themeData[AppThemeEnum.LightTheme],
        localizationsDelegates: const [
          AppLocalizations.delegate,
        ],
        home: BlocProvider<MainBloc>.value(
          value: mainBloc,
          child: RepostsListPage(post),
        ),
      ),
    );

    await tester.pumpAndSettle(const Duration(seconds: 5));

    // THEN
    final appLocalizations = Localizations.of<AppLocalizations>(
      tester.element(find.byType(RepostsListPage)),
      AppLocalizations,
    )!;

    await screenMatchesGolden(
      tester,
      'reposts_list_page_no_reposts',
    );

    await expectLater(
      find.text(appLocalizations.post_cap_reposts),
      findsOneWidget,
    );
    await expectLater(
      find.text(appLocalizations.post_noRepostsYet),
      findsOneWidget,
    );
    await expectLater(
      find.text('Original post by @' + author.handle),
      findsOneWidget,
    );
  });

  testGoldens('RepostsListPage golden test posts', (WidgetTester tester) async {
    // GIVEN
    const numPosts = 5;
    final posts = List.generate(numPosts, (i) {
      final author = Author.fromJson(
        json.decode(
          authorPlaceholderJsonString.replaceFirst(
            'author_placeholder',
            'author' + i.toString(),
          ),
        ),
      );
      final post = Post.empty()
        ..bodyText = 'sample body ' + i.toString()
        ..author = author;
      return post;
    });

    whenListen(
      mainBloc,
      Stream.value(
        PaginateRepostedPostsState(
          posts: posts,
        ),
      ),
      initialState: PaginateRepostedPostsState(),
    );
    final author = Author.fromJson(json.decode(authorJsonString));
    final post = Post.empty()
      ..bodyText = 'post body'
      ..author = author;

    // WHEN
    await tester.pumpWidget(
      MaterialApp(
        theme: AppThemesData.themeData[AppThemeEnum.LightTheme],
        localizationsDelegates: const [
          AppLocalizations.delegate,
        ],
        home: BlocProvider<MainBloc>.value(
          value: mainBloc,
          child: RepostsListPage(post),
        ),
      ),
    );

    await tester.pumpAndSettle(const Duration(seconds: 5));

    // THEN
    final appLocalizations = Localizations.of<AppLocalizations>(
      tester.element(find.byType(RepostsListPage)),
      AppLocalizations,
    )!;

    await screenMatchesGolden(
      tester,
      'reposts_list_page_posts',
    );

    await expectLater(
      find.text('Original post by @' + author.handle),
      findsOneWidget,
    );

    await expectLater(
      find.text(appLocalizations.post_noRepostsYet),
      findsNothing,
    );
    for (int i = 0; i < numPosts; i++) {
      await expectLater(
        find.text('sample body ' + i.toString()),
        findsOneWidget,
      );
      await expectLater(
        find.text('@author' + i.toString()),
        findsOneWidget,
      );
    }
    await expectLater(
      find.text(appLocalizations.post_cap_view),
      findsNWidgets(numPosts),
    );
  });
}
