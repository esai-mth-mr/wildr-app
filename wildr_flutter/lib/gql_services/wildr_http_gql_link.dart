import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/auth/auth_headers_constants.dart';
import 'package:wildr_flutter/auth/auth_principal_provider.dart';
import 'package:wildr_flutter/constants/constants.dart';

void print(String message) {
  debugPrint('[WildrHttpGQLLink] $message');
}

class WildrHttpGQLLink extends HttpLink {
  late final AuthPrincipalProvider authPrincipalProvider;

  WildrHttpGQLLink(
    super.uri, {
    required super.httpClient,
    required this.authPrincipalProvider,
    super.defaultHeaders,
  }) : super();

  String _getBearerToken() => 'Bearer ${authPrincipalProvider.token ?? ''}';

  Map<String, String> get _additionalHeaders {
    final Map<String, String> map = {
      kGQLClientAuthorizationHeaderKey: _getBearerToken(),
    };
    final userId = authPrincipalProvider.userId;
    if (userId != null) map[kHeaderUserId] = userId;
    return map;
  }

  @override
  Stream<Response> request(Request request, [NextLink? forward]) async* {
    final Request req = request.updateContextEntry<HttpLinkHeaders>(
      (headers) => HttpLinkHeaders(
        headers: <String, String>{
          ...headers?.headers ?? <String, String>{},
          ..._additionalHeaders,
        },
      ),
    );
    yield* super.request(req, forward);
  }
}
