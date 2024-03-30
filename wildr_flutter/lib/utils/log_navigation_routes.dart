import 'package:flutter/material.dart';

void print(dynamic message) {
  debugPrint('🧭 Routing Observer: $message');
}

class LogRoutes extends RouteObserver<ModalRoute<dynamic>> {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);

    print(
      'Pushed route to: ${route.settings.name}.'
      ' PreviousRoute: ${previousRoute?.settings.name} '
      '${route.settings.hashCode} ${route.restorationScopeId}',
    );
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);

    print(
      'Replaced route to: ${newRoute?.settings.name}.'
      ' PreviousRoute: ${oldRoute?.settings.name}',
    );
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);

    print(
      'Popped route to: ${route.settings.name}.'
      ' PreviousRoute: ${previousRoute?.settings.name}',
    );
  }
}
