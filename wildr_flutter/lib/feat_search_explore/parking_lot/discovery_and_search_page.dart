import 'package:flutter/material.dart';
import 'package:page_transition/page_transition.dart';
import 'package:wildr_flutter/feat_search_explore/parking_lot/discovery/discovery_page.dart';
import 'package:wildr_flutter/feat_search_explore/search/search_page.dart';

class DiscoverySearchPage extends StatefulWidget {
  const DiscoverySearchPage({super.key});

  @override
  DiscoverySearchPageState createState() => DiscoverySearchPageState();
}

class DiscoverySearchPageState extends State<DiscoverySearchPage> {
  @override
  Widget build(BuildContext context) => Navigator(
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(builder: (_) => const DiscoveryPage());
          case '/search':
            return PageTransition(
              child: const SearchPage(),
              type: PageTransitionType.fade,
            );
          // return PageRouteBuilder(
          //   settings: settings,
          //   pageBuilder: (_, __, ___) => SearchPage(),
          //   transitionsBuilder: (_, a, __, c) =>
          //       FadeTransition(opacity: a, child: c),
          // );
        }
        return null;
      },
    );
}
