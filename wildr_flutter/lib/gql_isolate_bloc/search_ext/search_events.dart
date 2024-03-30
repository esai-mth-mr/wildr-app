import 'package:flutter/foundation.dart';
import 'package:wildr_flutter/analytics/analytics_parameters.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/home/model/mentioned_object.dart';

@Deprecated('No longer using this, check out other events')
class SearchInputEvent extends MainBlocEvent {
  final String query;
  final MentionedObjectEnum objectType;
  final int count;

  SearchInputEvent(
    this.query, {
    this.objectType = MentionedObjectEnum.USER,
    this.count = 10,
  }) : super();
}

class MentionsInputEvent extends MainBlocEvent {
  final String query;
  final ESSearchType type;
  final int count;

  MentionsInputEvent(this.query, this.type, {this.count = 10}) : super();

  Map<String, dynamic> getInput() => {
      'input': {
        'query': query,
        'type': type.toString().split('.').last,
        'size': count,
      },
    };

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kQuery:
          query.length >= 30 ? query.substring(0, 30) : query,
      AnalyticsParameters.kSearchType: type.name,
      AnalyticsParameters.kCount: count,
    };
}

class GetTopSearchResultsEvent extends MainBlocEvent {
  final String query;
  final int? fromCount;
  final int? size;
  final bool isPaginating;

  GetTopSearchResultsEvent(
    this.query, {
    this.fromCount,
    this.size,
    this.isPaginating = false,
  });

  Map<String, dynamic> getInput() {
    var query = this.query.trim();
    if (query.startsWith('#')) {
      query = query.substring(1, query.length);
    } else if (query.startsWith('@')) {
      query = query.substring(1, query.length);
    }
    return {
      'input': {
        'query': query,
        'type': 'TOP',
        'size': size,
        'from': fromCount,
      },
    };
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kQuery:
          query.length >= 30 ? query.substring(0, 30) : query,
    };
}

class PostsSearchEvent extends MainBlocEvent {
  final String query;
  final int? fromCount;
  final int? size;
  final bool isPaginating;
  final String? pageId;

  PostsSearchEvent(
    this.query, {
    this.fromCount,
    this.size,
    this.isPaginating = false,
    this.pageId,
  });

  Map<String, dynamic> getInput() {
    var query = this.query.trim();
    if (query.startsWith('#')) {
      query = query.substring(1, query.length);
    } else if (query.startsWith('@')) {
      query = query.substring(1, query.length);
    }
    return {
      'input': {
        'query': query,
        'type': 'POST',
        'size': size,
        'from': fromCount,
      },
    };
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kQuery:
          query.length >= 30 ? query.substring(0, 30) : query,
    };
}

class UsersSearchEvent extends MainBlocEvent {
  final String query;
  final int? fromCount;
  final int? size;
  final bool isPaginating;

  UsersSearchEvent(
    this.query, {
    this.fromCount,
    this.size = 27,
    this.isPaginating = false,
  });

  Map<String, dynamic> getInput() {
    var query = this.query.trim();
    if (query.startsWith('#')) {
      query = query.substring(1, query.length);
    } else if (query.startsWith('@')) {
      query = query.substring(1, query.length);
    }
    return {
      'input': {
        'query': query,
        'type': 'USER',
        'size': size,
        'from': fromCount,
      },
    };
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kQuery:
          query.length >= 30 ? query.substring(0, 30) : query,
    };
}

class TagsSearchEvent extends MainBlocEvent {
  final String query;
  final int? fromCount;
  final int? size;
  final bool isPaginating;

  TagsSearchEvent(
    this.query, {
    this.fromCount,
    this.size,
    this.isPaginating = false,
  });

  Map<String, dynamic> getInput() {
    var query = this.query.trim();
    if (query.startsWith('#')) {
      query = query.substring(1, query.length);
    } else if (query.startsWith('@')) {
      query = query.substring(1, query.length);
    }
    return {
      'input': {
        'query': query,
        'type': 'HASHTAGS',
        'size': size,
        'from': fromCount,
      },
    };
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kQuery:
          query.length >= 30 ? query.substring(0, 30) : query,
    };
}

enum ESSearchType { USER, HASHTAGS, POST, TOP }

class ESInputEvent extends MainBlocEvent {
  final String query;
  final ESSearchType type;
  final int? fromCount;
  final int? size;
  final bool isPaginating;

  ESInputEvent(
    this.query,
    this.type, {
    this.fromCount,
    this.size,
    this.isPaginating = false,
  });

  Map<String, dynamic> getInput() {
    var query = this.query.trim();
    if (query.startsWith('#')) {
      query = query.substring(1, query.length);
    } else if (query.startsWith('@')) {
      query = query.substring(1, query.length);
    }
    debugPrint("QUERY = '$query'");
    return {
      'input': {
        'query': query,
        'type': type.toString().split('.').last,
        'size': size,
        'from': fromCount,
      },
    };
  }

  @override
  Map<String, dynamic>? getAnalyticParameters() => {
      AnalyticsParameters.kQuery:
          query.length >= 30 ? query.substring(0, 30) : query,
    };
}
