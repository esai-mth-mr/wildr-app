import 'dart:math';

import 'package:flutter/widgets.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/gen/assets.gen.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/comment.dart';
import 'package:wildr_flutter/home/model/reply.dart';
import 'package:wildr_flutter/home/model/timestamp.dart';
import 'package:wildr_flutter/home/model/wildr_user.dart';

class Challenge extends ChallengeOrPost {
  late String name;
  bool? isCompleted;
  bool? willBeDeleted;
  ChallengeCover? cover;
  ChallengeStats? stats;
  ChallengeDescription? description;
  ChallengePreviewParticipants? previewParticipants;
  ChallengeParticipantsConnection? participantsConnection;
  ChallengeLeaderboardConnection? leaderboardConnection;
  ChallengeEntriesConnection? currentUserEntriesConnection;
  Map<String, ChallengeEntriesConnection>? userEntriesConnectionsMap;
  ChallengeEntriesConnection? allEntriesConnection;
  ChallengeEntriesConnection? todayEntriesConnection;
  ChallengeEntriesConnection? featuredEntriesConnection;
  ChallengeCurrentUserContext? currentUserContext;
  ChallengeCommentsConnection? challengeCommentsConnection;
  ChallengeAuthorInteractionConnection? challengeAuthorInteractionConnection;
  int? currentUserProgressCount;
  bool isOwner = false;

  ChallengeEntriesConnection getNonNullEntriesConnection(
    ChallengeConnectionType connectionType, {
    String? userId,
  }) {
    ChallengeEntriesConnection? returnValue;
    if (connectionType == ChallengeConnectionType.todayEntriesConnection) {
      returnValue = todayEntriesConnection;
    } else if (connectionType ==
        ChallengeConnectionType.featuredEntriesConnection) {
      returnValue = featuredEntriesConnection;
    } else if (connectionType ==
        ChallengeConnectionType.currentUserEntriesConnection) {
      returnValue = currentUserEntriesConnection;
    } else if (connectionType ==
        ChallengeConnectionType.userEntriesConnection) {
      returnValue = userEntriesConnectionsMap?[userId];
    } else if (connectionType == ChallengeConnectionType.allEntriesConnection) {
      returnValue = allEntriesConnection;
    }
    return returnValue ?? ChallengeEntriesConnection.shimmer();
  }

  bool isLoading = true;

  bool get hasJoined => currentUserContext?.hasJoined ?? false;

  bool get hasNotStarted => !isActive && isCompleted == false;

  int? get totalDays {
    if (timeStamp == null) return null;
    return timeStamp!.expiry!.difference(timeStamp!.start!).inDays + 1;
  }

  String? dateText({
    bool showEndDate = false,
    bool shouldTruncate = false,
    bool shouldShowCompleteStartDate = false,
    BuildContext? context,
  }) {
    String? languageCode;
    if (context != null) {
      initializeDateFormatting();
      languageCode = Localizations.localeOf(context).languageCode;
    }
    if (showEndDate) {
      if (timeStamp?.expiry == null) return null;
      final formattedDate = DateFormat('MMM d, yyyy', languageCode)
          .format(timeStamp!.expiry!.toLocal());
      final String prefix = (isCompleted ?? false) ? 'Ended on ' : 'Ends ';
      return '$prefix$formattedDate';
    }
    if (isActive) {
      if (daysRemaining == null) return null;
      if (daysRemaining == 0) return 'Ends Today';
      return '${daysRemaining}d ${shouldTruncate ? '' : 'left'}';
    } else if (isCompleted ?? false) {
      return 'Past';
    } else {
      final startsInDate = startsIn;
      if (startsInDate == null) return null;
      if (startsInDate == 0) return 'Starts Today';
      if (startsInDate == 1) return 'Starts Tomorrow';
      if (shouldShowCompleteStartDate) {
        final formattedDate = DateFormat('MMM d, yyyy', languageCode)
            .format(timeStamp!.start!.toLocal());
        return 'Starts on $formattedDate';
      } else {
        return 'Starts in $startsInDate days';
      }
    }
  }

  bool get isActive {
    if (timeStamp == null) return false;
    final start = timeStamp!.start;
    final end = timeStamp!.expiry;
    if (start == null || end == null) return false;
    final ms = DateTime.now().millisecondsSinceEpoch;
    return start.millisecondsSinceEpoch <= ms &&
        end.millisecondsSinceEpoch >= ms;
  }

  int? get startsIn {
    final start = timeStamp?.start?.toLocal();
    if (start == null) {
      return null;
    } else {
      final diff = start.difference(DateTime.now()).inDays;
      if (diff == 0) {
        if (start.day != DateTime.now().day) return 1;
      }
      return diff;
    }
  }

  int? get daysRemaining {
    final endDate = timeStamp?.expiry;
    if (endDate == null) {
      return null;
    } else {
      return endDate.difference(DateTime.now()).inDays + 1;
    }
  }

  int get interactionCount =>
      min(challengeAuthorInteractionConnection?.interactionCount ?? 0, 10);

  void fromSingleChallengeDetails(Challenge c) {
    id = c.id;
    name = c.name;
    isCompleted = c.isCompleted;
    willBeDeleted = c.willBeDeleted;
    cover = c.cover;
    stats = c.stats;
    description = c.description;
    author = c.author;
    timeStamp = c.timeStamp;
    previewParticipants = c.previewParticipants;
    currentUserContext = c.currentUserContext;
    challengeAuthorInteractionConnection =
        c.challengeAuthorInteractionConnection;
    isOwner = c.isOwner;
  }

  // Challenge.empty() {
  //   id = '';
  //   name = 'n/a';
  // }

  Challenge.empty({String? defaultId}) {
    id = defaultId ?? '';
    name = 'n/a';
  }

  String? get coverImageUri => cover?.imageUri;

  Challenge.fromJson(
    Map<String, dynamic> j, {
    PaginationState? paginationState,
  }) {
    paginationState ??= PaginationState.SHOW_SHIMMER;
    id = j['id'];
    name = j['name'];
    isCompleted = j['isCompleted'];
    willBeDeleted = j['willBeDeleted'];
    description = j['description'] == null
        ? null
        : ChallengeDescription.fromJson(j['description']);
    cover = j['cover'] == null
        ? ChallengeCover.placeholder()
        : ChallengeCover.fromJson(j['cover']);
    stats = j['stats'] == null ? null : ChallengeStats.fromJson(j['stats']);
    author =
        j['author'] == null ? Author.empty() : Author.fromJson(j['author']);
    timeStamp = j['ts'] == null ? null : TimeStamp.fromJson(j['ts']);
    previewParticipants = j['previewParticipants'] == null
        ? null
        : ChallengePreviewParticipants.fromJson(j['previewParticipants']);
    participantsConnection = j['participantsConnection'] == null
        ? null
        : ChallengeParticipantsConnection.fromJson(
            j['participantsConnection'],
            paginationState,
          );
    leaderboardConnection = j['leaderboardConnection'] == null
        ? null
        : ChallengeLeaderboardConnection.fromJson(
            j['leaderboardConnection'],
            paginationState,
          );
    currentUserEntriesConnection = j['currentUserEntriesConnection'] == null
        ? null
        : ChallengeEntriesConnection.fromJson(
            j['currentUserEntriesConnection'],
            paginationState,
            type: ChallengeConnectionType.currentUserEntriesConnection,
          );
    currentUserProgressCount =
        currentUserEntriesConnection?.pageInfo?.totalCount;
    _fillRemainingEntriesInCurrentUserProgress();
    _parseUserEntriesConnection(j, paginationState);
    allEntriesConnection = j['allEntriesConnection'] == null
        ? null
        : ChallengeEntriesConnection.fromJson(
            j['allEntriesConnection'],
            paginationState,
            type: ChallengeConnectionType.allEntriesConnection,
          );
    todayEntriesConnection = j['todayEntriesConnection'] == null
        ? null
        : ChallengeEntriesConnection.fromJson(
            j['todayEntriesConnection'],
            paginationState,
          );
    featuredEntriesConnection = j['featuredEntriesConnection'] == null
        ? null
        : ChallengeEntriesConnection.fromJson(
            j['featuredEntriesConnection'],
            paginationState,
          );
    currentUserContext = j['currentUserContext'] == null
        ? null
        : ChallengeCurrentUserContext.fromJson(j['currentUserContext']);
    challengeCommentsConnection = j['challengeCommentsConnection'] == null
        ? null
        : ChallengeCommentsConnection.fromJson(
            j['challengeCommentsConnection'],
          );
    challengeAuthorInteractionConnection =
        j['authorInteractionsConnection'] == null
            ? null
            : ChallengeAuthorInteractionConnection.fromJson(
                j['authorInteractionsConnection'],
              );
    if (j['pinnedComment'] != null) {
      pinnedComment = Comment.fromJson(j['pinnedComment']);
    }
    isOwner = j['isOwner'] ?? false;
  }

  void _parseUserEntriesConnection(
    Map<String, dynamic> j,
    PaginationState state,
  ) {
    final Map<String, dynamic>? connection = j['userEntriesConnection'];
    if (connection == null) return;
    final userToSearchForId = connection['userToSearchForId'];
    if (userToSearchForId == null) return;
    userEntriesConnectionsMap ??= {};
    userEntriesConnectionsMap?[userToSearchForId] =
        ChallengeEntriesConnection.fromJson(connection, state);
  }

  //TODO: Fix ME
  void _fillRemainingEntriesInCurrentUserProgress() {
    if (currentUserEntriesConnection == null) return;
    if (isCompleted ?? false) return;
    currentUserEntriesConnection!.entries
        .addAll(List.generate(1, (index) => ChallengeEntry.forToBePosted()));
  }

  Challenge.forActivity(Map<String, dynamic> map) {
    id = map['id'];
    name = map['name'];
    cover = ChallengeCover.fromJson(map['cover']);
  }
}

// region Cover
enum ChallengeCoverPresetEnum {
  TYPE_1,
  TYPE_2,
  TYPE_3,
  TYPE_4,
  TYPE_5,
  TYPE_6,
  TYPE_7,
  TYPE_8,
}

extension ChallengeCoverPresetImage on ChallengeCoverPresetEnum {
  AssetGenImage get image {
    switch (this) {
      case ChallengeCoverPresetEnum.TYPE_1:
        return Assets.challenges.coverWorkOut;
      case ChallengeCoverPresetEnum.TYPE_2:
        return Assets.challenges.coverFood;
      case ChallengeCoverPresetEnum.TYPE_3:
        return Assets.challenges.coverArt;
      case ChallengeCoverPresetEnum.TYPE_4:
        return Assets.challenges.coverWriting;
      case ChallengeCoverPresetEnum.TYPE_5:
        return Assets.challenges.coverReading;
      case ChallengeCoverPresetEnum.TYPE_6:
        return Assets.challenges.coverMoney;
      case ChallengeCoverPresetEnum.TYPE_7:
        return Assets.challenges.coverNature;
      case ChallengeCoverPresetEnum.TYPE_8:
        return Assets.challenges.coverGeneral;
    }
  }
}

extension ChallengeCoverPresetImageUrl on ChallengeCoverPresetEnum {
  String get uri {
    switch (this) {
      case ChallengeCoverPresetEnum.TYPE_1:
        return '$kPresetCoverPhotoBaseUrl/TYPE_1.png';
      case ChallengeCoverPresetEnum.TYPE_2:
        return '$kPresetCoverPhotoBaseUrl/TYPE_2.png';
      case ChallengeCoverPresetEnum.TYPE_3:
        return '$kPresetCoverPhotoBaseUrl/TYPE_3.png';
      case ChallengeCoverPresetEnum.TYPE_4:
        return '$kPresetCoverPhotoBaseUrl/TYPE_4.png';
      case ChallengeCoverPresetEnum.TYPE_5:
        return '$kPresetCoverPhotoBaseUrl/TYPE_5.png';
      case ChallengeCoverPresetEnum.TYPE_6:
        return '$kPresetCoverPhotoBaseUrl/TYPE_6.png';
      case ChallengeCoverPresetEnum.TYPE_7:
        return '$kPresetCoverPhotoBaseUrl/TYPE_7.png';
      case ChallengeCoverPresetEnum.TYPE_8:
        return '$kPresetCoverPhotoBaseUrl/TYPE_8.png';
    }
  }
}

class MediaSource {
  late String? uri;

  MediaSource({
    this.uri,
  });

  MediaSource.empty() {
    uri = '';
  }

  MediaSource.fromJson(Map<String, dynamic> json) {
    uri = json['uri'];
  }
}

class ChallengeImage {
  late final String? id;
  late final MediaSource? source;
  late final String? type;

  ChallengeImage.empty() {
    id = '';
    source = MediaSource.empty();
    type = '';
  }

  ChallengeImage.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    source = json['source'] != null
        ? MediaSource.fromJson(json['source'])
        : MediaSource.empty();
    type = json['type'] as String?;
  }

  String? get uri => source?.uri;
}

class ChallengeCoverImage {
  late final ChallengeImage? image;
  late final ChallengeImage? thumbnail;

  ChallengeCoverImage.fromJson(Map<String, dynamic> json) {
    image = json['image'] != null
        ? ChallengeImage.fromJson(json['image'])
        : ChallengeImage.empty();
    thumbnail = json['thumbnail'] != null
        ? ChallengeImage.fromJson(json['thumbnail'])
        : ChallengeImage.empty();
  }

  String? get thumbUri => thumbnail?.uri;

  String? get imageUri => image?.uri;
}

class ChallengeCover {
  late final ChallengeCoverImage? coverImage;
  late final ChallengeCoverPresetEnum? coverImageEnum;

  String? get imageUri => coverImage?.imageUri;

  ChallengeCover.placeholder() {
    coverImage = null;
    coverImageEnum = ChallengeCoverPresetEnum.TYPE_1;
  }

  ChallengeCover.fromJson(Map<String, dynamic>? cover) {
    if (cover == null) {
      coverImage = null;
      coverImageEnum = null;
      return;
    }
    if (cover['coverImageEnum'] != null) {
      coverImageEnum = ChallengeCoverPresetEnum.values.firstWhere(
        (element) =>
            element.toString().split('.')[1] == cover['coverImageEnum'],
      );
      coverImage = null;
      return; //shouldn't try parsing CoverImage
    } else if (cover['coverImage'] != null) {
      coverImage = ChallengeCoverImage.fromJson(cover['coverImage']);
      coverImageEnum = null;
      return;
    } else {
      coverImage = null;
      coverImageEnum = null;
    }
  }
}
//endregion

// region Stats
class ChallengeStats {
  late final int entryCount;
  late final int participantCount;
  late final int commentCount;
  late final int shareCount;
  late final int reportCount;

  ChallengeStats.fromJson(Map<String, dynamic> json) {
    entryCount = json['entryCount'] ?? 0;
    participantCount = json['participantCount'] ?? 0;
    commentCount = json['commentCount'] ?? 0;
    shareCount = json['shareCount'] ?? 0;
    reportCount = json['reportCount'] ?? 0;
  }
}
//endregion

//region Description
class ChallengeDescription {
  late final String? body;
  late final List<Segment>? segments;

  ChallengeDescription.fromJson(Map<String, dynamic> json) {
    body = json['body'];
    if (json['segments'] == null) {
      segments = [];
      return;
    }
    final List listOfSegments = json['segments'];
    segments =
        listOfSegments.map((element) => Segment.fromJson(element)).toList();
  }
}
//endregion

//region PreviewParticipants
class ChallengePreviewParticipants {
  late final String? displayText;
  late final List<WildrUser>? participants;

  ChallengePreviewParticipants.fromJson(Map<String, dynamic> json) {
    displayText = json['displayText'];
    if (json['participants'] == null) {
      participants = null;
      return;
    }
    final List participantsJSONList = json['participants'] as List;
    participants =
        participantsJSONList.map((data) => WildrUser.fromJson(data)).toList();
  }
}
//endregion

//region Participant and Leaderboard Connections
class ChallengeParticipant {
  final WildrUser user;
  final Post? post;
  final int? entryCount;
  final bool? isFriend;
  final bool? isCreator;
  final bool isLoading;

  const ChallengeParticipant({
    required this.user,
    this.post,
    this.entryCount,
    this.isFriend,
    this.isCreator,
    this.isLoading = false,
  });

  factory ChallengeParticipant.shimmer() => ChallengeParticipant(
        user: WildrUser.empty(),
        isLoading: true,
      );

  factory ChallengeParticipant.fromJson(Map<String, dynamic>? json) {
    final Map<String, dynamic>? node = json;
    if (node == null) {
      return ChallengeParticipant.placeholder();
    }
    final user = node['user'] == null
        ? WildrUser.empty()
        : WildrUser.fromJson(node['user']);
    final post = node['post'] == null ? null : Post.fromNode(node['post']);
    return ChallengeParticipant(
      user: user,
      post: post,
      entryCount: node['entryCount'],
      isFriend: node['isFriend'],
      isCreator: node['isCreator'],
    );
  }

  factory ChallengeParticipant.placeholder() => ChallengeParticipant(
        user: WildrUser.empty(),
        entryCount: 0,
        isFriend: false,
        isCreator: false,
      );
}

class ChallengeParticipantsConnection {
  late final PageInfo? pageInfo;
  late final String? errorMessage;
  PaginationState state;
  late final List<ChallengeParticipant> participants;

  bool get canPaginate => pageInfo?.hasNextPage ?? false;

  String? get afterCursor => pageInfo?.endCursor;

  bool get isShimmering => state == PaginationState.SHOW_SHIMMER;

  bool get isRefreshing => state == PaginationState.REFRESHING;

  bool get isPaginating => state == PaginationState.PAGINATING;

  ChallengeParticipantsConnection.shimmer()
      : state = PaginationState.SHOW_SHIMMER {
    pageInfo = null;
    errorMessage = null;
    participants = [];
  }

  ChallengeParticipantsConnection.fromJson(
    Map<String, dynamic> json,
    this.state,
  ) {
    if (json['edges'] == null) {
      participants = [];
      return;
    }
    pageInfo = PageInfo.fromJson(json['pageInfo'] ?? {});
    errorMessage = null;
    final List edges = json['edges'] as List;
    if (edges.isEmpty) {
      participants = [];
    } else {
      participants = edges
          .map((edge) => ChallengeParticipant.fromJson(edge['node']))
          .toList();
      pageInfo?.endCursor ??= participants.last.user.id;
    }
  }

  ChallengeParticipantsConnection.fromError(this.errorMessage)
      : pageInfo = null,
        state = PaginationState.ERROR,
        participants = [];
}

class ChallengeLeaderboardConnection {
  late final PageInfo? pageInfo;
  late final List<ChallengeParticipant> participants;
  PaginationState state;
  late final String? errorMessage;

  bool get canPaginate => pageInfo?.hasNextPage ?? false;

  String? get afterCursor => pageInfo?.endCursor;

  bool get isShimmering => state == PaginationState.SHOW_SHIMMER;

  bool get isRefreshing => state == PaginationState.REFRESHING;

  bool get isPaginating => state == PaginationState.PAGINATING;

  List<ChallengeParticipant> get _shimmerEntries =>
      List.generate(10, (index) => ChallengeParticipant.shimmer());

  ChallengeLeaderboardConnection.shimmer()
      : pageInfo = null,
        errorMessage = null,
        state = PaginationState.SHOW_SHIMMER {
    participants = _shimmerEntries;
  }

  ChallengeLeaderboardConnection.fromError(this.errorMessage)
      : pageInfo = null,
        state = PaginationState.ERROR,
        participants = [];

  ChallengeLeaderboardConnection.empty()
      : pageInfo = null,
        errorMessage = null,
        state = PaginationState.SHOW_SHIMMER,
        participants = [];

  ChallengeLeaderboardConnection.fromJson(
    Map<String, dynamic> json,
    this.state,
  ) {
    pageInfo = PageInfo.fromJson(json['pageInfo'] ?? {});
    if (json['edges'] == null) {
      participants = [];
      return;
    }
    errorMessage = null;
    final List edges = json['edges'] as List;
    participants = edges
        .map((edge) => ChallengeParticipant.fromJson(edge['node']))
        .toList();

    if (pageInfo?.endCursor == null && participants.isNotEmpty) {
      pageInfo?.endCursor = participants.last.user.id;
    }
  }
}
//endregion

//region ChallengeEntries
class ChallengeEntry {
  late final String cursor;
  late final Post post;
  late final bool isToBePostedEntry;
  late final bool isForFuture;
  late final bool isLoading;

  ChallengeEntry.shimmer() {
    isToBePostedEntry = false;
    cursor = '';
    isLoading = true;
    isForFuture = false;
    post = Post.empty();
  }

  ChallengeEntry.forToBePosted() {
    isToBePostedEntry = true;
    cursor = '';
    isLoading = false;
    isForFuture = false;
    post = Post.empty();
  }

  ChallengeEntry.future() {
    isToBePostedEntry = false;
    cursor = '';
    isLoading = false;
    isForFuture = true;
    post = Post.empty();
  }

  ChallengeEntry.fromJson(Map<String, dynamic> json) {
    isToBePostedEntry = false;
    cursor = json['cursor'] ?? '';
    post = json['node'] == null ? Post.empty() : Post.fromNode(json['node']);
    isLoading = false;
    isForFuture = false;
  }
}

class ChallengeEntriesConnection {
  late final PageInfo? pageInfo;
  late final List<ChallengeEntry> _entries;
  late final String? errorMessage;
  late final String? userToSearchForId;
  PaginationState state;
  FeedGxC? feedGxC;

  bool get canPaginate =>
      (pageInfo?.hasNextPage ?? false) && state != PaginationState.PAGINATING;

  String? get afterCursor => pageInfo?.endCursor;

  bool get isShimmering => state == PaginationState.SHOW_SHIMMER;

  bool get isPaginating => state == PaginationState.PAGINATING;

  bool get isRefreshing => state == PaginationState.REFRESHING;

  List<ChallengeEntry> get _shimmerEntries =>
      List.generate(10, (index) => ChallengeEntry.shimmer());

  List<ChallengeEntry> get entries {
    if (isShimmering) {
      return _shimmerEntries;
    }
    return _entries;
  }

  ChallengeEntriesConnection.fromError(this.errorMessage)
      : pageInfo = null,
        state = PaginationState.ERROR,
        _entries = [];

  ChallengeEntriesConnection.empty()
      : pageInfo = null,
        errorMessage = null,
        state = PaginationState.DONE_REFRESHING,
        _entries = [];

  ChallengeEntriesConnection.shimmer()
      : pageInfo = null,
        errorMessage = null,
        state = PaginationState.SHOW_SHIMMER {
    _entries = _shimmerEntries;
  }

  ChallengeEntriesConnection.fromJson(
    Map<String, dynamic> json,
    this.state, {
    ChallengeConnectionType? type,
  }) {
    pageInfo =
        json['pageInfo'] != null ? PageInfo.fromJson(json['pageInfo']) : null;
    if (json['edges'] == null) {
      _entries = [];
      return;
    }
    userToSearchForId = json['userToSearchForId'];
    final List edgesJson = json['edges'] as List;
    _entries = edgesJson
        .map((edge) => ChallengeEntry.fromJson(edge))
        .where((element) => !(element.post.willBeDeleted ?? false))
        .toList();
  }
}
//endregion

//region AuthorInteraction
class ChallengeInteractionPinEntry {
  late Post? entry;

  ChallengeInteractionPinEntry({required this.entry});

  ChallengeInteractionPinEntry.empty() {
    entry = Post.empty();
  }

  ChallengeInteractionPinEntry.fromJson(Map<String, dynamic> json) {
    entry = json['entry'] != null ? Post.fromEdge(json['entry']) : Post.empty();
  }
}

class ChallengeAuthorInteractionEdge {
  late Comment? comment;
  late Reply? reply;
  late ChallengeInteractionPinEntry? challengeInteractionPinEntry;
  late DateTime? interactedAt;

  ChallengeAuthorInteractionEdge({
    this.comment,
    this.reply,
    this.interactedAt,
  });

  ChallengeAuthorInteractionEdge.fromJson(Map<String, dynamic> json) {
    final interactionType = json['interaction']['__typename'] as String;
    final interactionJson = json['interaction'];

    switch (interactionType) {
      case 'Comment':
        comment = interactionJson != null
            ? Comment.fromJson(interactionJson)
            : Comment.empty();
      case 'Reply':
        reply =
            interactionJson != null ? Reply.fromEdge(interactionJson) : null;
      case 'ChallengeInteractionPinEntry':
        challengeInteractionPinEntry = interactionJson != null
            ? ChallengeInteractionPinEntry.fromJson(interactionJson)
            : ChallengeInteractionPinEntry.empty();
      default:
        throw ArgumentError('Invalid AuthorInteraction type: $interactionType');
    }
    if (json[interactedAt] == null) {
      interactedAt = null;
      return;
    }
    interactedAt = DateTime.parse(json['interactedAt'] as String);
  }
}

class ChallengeAuthorInteractionConnection {
  late final int? interactionCount;
  late final String? errorMessage;

  ChallengeAuthorInteractionConnection.fromError(this.errorMessage)
      : interactionCount = null;

  ChallengeAuthorInteractionConnection.fromJson(Map<String, dynamic> json) {
    interactionCount = json['interactionCount'];
    errorMessage = null;
  }
}
//endregion

//region ChallengeCurrentUserContext
class ChallengeCurrentUserContext {
  late final bool? hasJoined;
  late final bool isOwner;

  ChallengeCurrentUserContext.fromJson(Map<String, dynamic> json) {
    hasJoined = json['hasJoined'];
    isOwner = json['isOwner'] ?? false;
  }
}
//endregion

//region ChallengeCommentsConnection
class ChallengeCommentEdge {
  late String? cursor;
  late Comment? comment;

  ChallengeCommentEdge.fromJson(Map<String, dynamic> json) {
    cursor = json['cursor'];
    if (json['node'] == null) {
      comment = null;
      return;
    }
    comment = Comment.fromJson(json['node']);
  }
}

class ChallengeCommentsConnection {
  late PageInfo? pageInfo;
  late List<ChallengeCommentEdge> commentEdges;
  late String? targetCommentError;
  late String? errorMessage;

  List<Comment> get comments => commentEdges
      .map((edge) => edge.comment)
      .where((comment) => comment != null)
      .toList()
      .cast<Comment>();

  ChallengeCommentsConnection.fromError(this.errorMessage)
      : pageInfo = null,
        commentEdges = [],
        targetCommentError = null;

  ChallengeCommentsConnection.fromJson(Map<String, dynamic> json) {
    pageInfo = PageInfo.fromJson(json['pageInfo'] ?? {});
    if (json['edges'] == null) {
      commentEdges = [];
      return;
    }
    final List edgesJson = json['edges'] as List;
    commentEdges =
        edgesJson.map((edge) => ChallengeCommentEdge.fromJson(edge)).toList();
    targetCommentError = json['targetCommentError'];
  }
}
//endregion
