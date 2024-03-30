import 'package:flutter/foundation.dart';

typedef GetTokenRetryCallback = Function(Exception? e, int retryCount)?;

class TokenRetrievalCallbacks {
  final GetTokenRetryCallback? disableGQLEvents;
  final VoidCallback? enableGQLEvents;
  final VoidCallback? onTokenTakingLongerToRetrieve;
  final VoidCallback? onUserUnavailable;
  final VoidCallback? onNetworkUnstable;

  TokenRetrievalCallbacks({
    this.disableGQLEvents,
    this.enableGQLEvents,
    this.onTokenTakingLongerToRetrieve,
    this.onUserUnavailable,
    this.onNetworkUnstable,
  });
}

class RefreshTokenCallbacks extends TokenRetrievalCallbacks {
  Function(String?)? onTokenChanged;

  RefreshTokenCallbacks({
    super.disableGQLEvents,
    super.enableGQLEvents,
    super.onTokenTakingLongerToRetrieve,
    super.onUserUnavailable,
    super.onNetworkUnstable,
    this.onTokenChanged,
  });
}
