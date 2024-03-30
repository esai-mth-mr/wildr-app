import 'dart:developer';

import 'package:firebase_performance/firebase_performance.dart';
import 'package:flutter/foundation.dart';
// ignore: implementation_imports
import 'package:graphql/src/core/_base_options.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:wildr_flutter/auth/auth_headers_constants.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_services/g_all_queries.dart';
import 'package:wildr_flutter/gql_services/mutation_operations.dart';

const String DEV_URL = 'https://dev.api.wildr.com/graphql';
const String STAGING_URL = 'https://staging.api.wildr.com/graphql';
const String PROD_URL = 'https://api.wildr.com/graphql';

void print(String message) {
  debugPrint('[GService Isolate] $message');
}

class GServiceIsolate {
  late GraphQLClient client;
  bool shouldAddTraces = false;
  final GraphQLCache _cache = GraphQLCache();
  bool isDisconnected = false;
  bool canPrintLogs = true;
  GraphqlIsolateBloc isolateBloc;
  bool shouldReturnError = false;

  GServiceIsolate(
    this.isolateBloc,
    HttpLink httpGqlLink, {
    this.canPrintLogs = false,
  }) {
    client = GraphQLClient(link: httpGqlLink, cache: _cache);
  }

  static String createQuery(String queryStr, List<String> fragments) {
    String str = '';
    for (final element in fragments) {
      str += '$element\n';
    }
    return str += queryStr;
  }

  ObservableQuery? performWatchQuery(
    String query, {
    Map<String, dynamic>? variables,
    required String operationName,
    CacheRereadPolicy cacheRereadPolicy = CacheRereadPolicy.mergeOptimistic,
    FetchPolicy fetchPolicy = FetchPolicy.cacheAndNetwork,
  }) {
    final WatchQueryOptions options = WatchQueryOptions(
      fetchResults: true,
      document: gql(query),
      variables: variables ?? {},
      fetchPolicy: fetchPolicy,
      cacheRereadPolicy: cacheRereadPolicy,
      operationName: operationName,
      context: Context.fromList([
        HttpLinkHeaders(headers: {kOperationNameHeader: operationName}),
      ]),
    );
    if (_defaultErrorResultIfInErrorState(options) != null) return null;
    return client.watchQuery(options);
  }

  // @Deprecated('Use performMutation()')
  Future<QueryResult> performMutationWith(
    String operationName, {
    Map<String, dynamic>? variables,
    bool shouldPrintLog = false,
    GraphQLClient? tempClient,
  }) async {
    if (isDisconnected) return _disconnectedError();
    final MutationOptions options = MutationOptions(
      document: gql(GAllQueries.allQueries()),
      variables: variables ?? {},
      operationName: operationName,
      cacheRereadPolicy: CacheRereadPolicy.mergeOptimistic,
      context: Context.fromList([
        HttpLinkHeaders(headers: {kOperationNameHeader: operationName}),
      ]),
    );
    Trace? trace;
    if (shouldAddTraces) {
      trace = FirebasePerformance.instance.newTrace(operationName);
    }
    await trace?.start();
    final result = _defaultErrorResultIfInErrorState(options) ??
        await client.mutate(options);
    trace?.putAttribute(
      operationName,
      result.hasException ? 'failed' : 'success',
    );
    trace?.setMetric(operationName, result.hasException ? 0 : 1);
    await trace?.stop();
    if (shouldPrintLog && canPrintLogs) {
      debugPrint(
        '''
        Mutation: $operationName
        Variables: $variables
        Result: $result
        ''',
      );
    }
    if (operationName != MutationOperations.kLogin) {
      debugPrint(operationName);
      _logoutUserOn401IfNeeded(result, operationName);
    }
    return result;
  }

  Future<QueryResult> performQuery(
    String queryStr, {
    Map<String, dynamic>? variables,
    required String operationName,
    GraphQLClient? tempClient,
    bool shouldPrintLog = false,
    FetchPolicy fetchPolicy = FetchPolicy.networkOnly,
    CacheRereadPolicy? cacheRereadPolicy,
  }) async {
    if (isDisconnected) return _disconnectedError();
    Trace? trace;
    if (shouldAddTraces) {
      trace = FirebasePerformance.instance.newTrace(operationName);
    }
    await trace?.start();
    final QueryOptions options = QueryOptions(
      document: gql(r'' + queryStr),
      variables: variables ?? {},
      fetchPolicy: fetchPolicy,
      operationName: operationName,
      cacheRereadPolicy: cacheRereadPolicy,
      context: Context.fromList([
        HttpLinkHeaders(headers: {kOperationNameHeader: operationName}),
      ]),
    );
    debugPrint('Sending query Operation: $operationName');
    final result = _defaultErrorResultIfInErrorState(options) ??
        await client.query(options);
    debugPrint('Got result for the query: $operationName');
    trace?.putAttribute(
      operationName,
      result.hasException ? 'failed' : 'success',
    );
    trace?.setMetric(
      operationName,
      result.hasException ? 0 : 1,
    );
    await trace?.stop();
    debugPrint(operationName);
    _logoutUserOn401IfNeeded(result, operationName);
    if (shouldPrintLog && canPrintLogs) {
      log(
        '''
        OperationName $operationName
        Variables: $variables
        Result: $result
        ''',
      );
    }
    return result;
  }

  Future<QueryResult> performMutation(
    String query, {
    Map<String, dynamic>? variables,
    required String operationName,
    bool shouldPrintLog = false,
    CacheRereadPolicy? cacheRereadPolicy,
    FetchPolicy? fetchPolicy,
  }) async {
    if (isDisconnected) return _disconnectedError();
    Trace? trace;
    if (shouldAddTraces) {
      trace = FirebasePerformance.instance.newTrace(operationName);
    }
    await trace?.start();
    final MutationOptions options = MutationOptions(
      document: gql(query),
      variables: variables ?? {},
      operationName: operationName,
      cacheRereadPolicy: cacheRereadPolicy,
      fetchPolicy: fetchPolicy,
      context: Context.fromList([
        HttpLinkHeaders(headers: {kOperationNameHeader: operationName}),
      ]),
    );
    debugPrint(operationName);
    final result = _defaultErrorResultIfInErrorState(options) ??
        await client.mutate(options);
    if (shouldPrintLog && canPrintLogs) {
      log(
        '''
        Mutation: $operationName
        Variables: $variables
        Result: $result
        ''',
      );
    }
    trace?.putAttribute(
      operationName,
      result.hasException ? 'failed' : 'success',
    );
    trace?.setMetric(operationName, result.hasException ? 0 : 1);
    await trace?.stop();
    _logoutUserOn401IfNeeded(result, operationName);
    return result;
  }

  QueryResult? _defaultErrorResultIfInErrorState(BaseOptions<Object?> options) {
    if (!shouldReturnError) return null;
    debugPrint('Triggering error state for ${options.operationName}');
    final QueryResult result = QueryResult(
      options: options,
      source: QueryResultSource.network,
    );
    // ignore: cascade_invocations
    result.exception = OperationException(
      graphqlErrors: const [
        GraphQLError(
          message: kSomethingWentWrong,
          extensions: {
            'statusCode': 500,
          },
        ),
      ],
    );
    return result;
  }

  QueryResult _logoutUserOn401IfNeeded(
    QueryResult result,
    String operationName,
  ) {
    if (result.is401()) {
      debugPrint('Logging out user on 401 $operationName');
      debugPrint(result.toString());
      isolateBloc.add(Request401LogoutGqlIsolateEvent(operationName));
      result.exception!.graphqlErrors.first =
          const GraphQLError(message: 'Please Login First');
    }
    return result;
  }

  QueryResult _disconnectedError() => QueryResult(
        options: QueryOptions(document: gql('')),
        source: QueryResultSource.cache,
        data: {'noNetworkError': true},
      );
}

extension QueryResultError on QueryResult {
  bool is401() {
    if (hasException) {
      final List<GraphQLError> errors = exception!.graphqlErrors;
      if (errors.isNotEmpty) {
        if (errors[0].extensions != null) {
          return getStatusCode(errors[0]) == '401';
        }
      }
    }
    return false;
  }

  String? getStatusCode(GraphQLError error) {
    if (error.extensions != null) {
      final extensions = error.extensions!;
      if (extensions['statusCode'] != null) {
        return extensions['statusCode'].toString();
      }
    }
    return null;
  }
}
