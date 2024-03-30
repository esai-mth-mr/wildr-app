import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/bloc/single_challenge_bloc.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/challenges_ext/challenge_queries.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/post_feed/posts_feed_page.dart';

void print(dynamic message) {
  debugPrint('[ChallengePostEntriesPage]: $message');
}

void printE(dynamic message) {
  debugPrint('❌❌❌ [ChallengePostEntriesPage]: $message');
}

class ChallengePostEntriesPage extends StatefulWidget {
  final String challengeId;
  final String fetchPostsUserId;
  final String participantHandle;
  final SingleChallengeBloc bloc;

  const ChallengePostEntriesPage({
    super.key,
    required this.challengeId,
    required this.fetchPostsUserId,
    required this.participantHandle,
    required this.bloc,
  });

  @override
  State<ChallengePostEntriesPage> createState() =>
      _ChallengePostEntriesPageState();
}

class _ChallengePostEntriesPageState extends State<ChallengePostEntriesPage> {
  Challenge get _challenge => widget.bloc.challenge;

  late final MainBloc _mainBloc;
  late final tag = '${_challenge.id}#'
      '${ChallengeConnectionType.userEntriesConnection.name}'
      '${widget.fetchPostsUserId}';
  late final FeedGxC _feedGxC;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  ChallengeEntriesConnection get _entriesConnection =>
      _challenge.getNonNullEntriesConnection(
        ChallengeConnectionType.userEntriesConnection,
        userId: widget.fetchPostsUserId,
      );

  @override
  void initState() {
    _feedGxC = Get.put(FeedGxC(), tag: tag);
    _onRefresh();
    super.initState();
    _mainBloc = context.read<MainBloc>();
    _feedGxC.challengeId = _challenge.id;
  }

  void _onRefresh() {
    if (_entriesConnection.isRefreshing) {
      print('Can not refresh, already refreshing');
      return;
    }
    widget.bloc.add(
      PaginateUserEntriesEvent(
        widget.challengeId,
        userId: widget.fetchPostsUserId,
      ),
    );
  }

  void _paginate() {
    if (!_entriesConnection.canPaginate) {
      return;
    }
    widget.bloc.add(
      PaginateUserEntriesEvent(
        widget.challengeId,
        userId: widget.fetchPostsUserId,
        after: _entriesConnection.afterCursor,
      ),
    );
  }

  void _listener(context, SingleChallengeState state) {
    if (state is PaginateUserEntriesState) {
      if (state.errorMessage != null) {
        print('Error message not null');
        Common().showSnackBar(
          context,
          state.errorMessage!,
          isDisplayingError: true,
        );
        return;
      }
      if (state.challengeId == _challenge.id &&
          state.userId == widget.fetchPostsUserId) {
        _feedGxC
          ..posts =
              _entriesConnection.entries.map((entry) => entry.post).toList()
          ..updateCurrentVisiblePost();
        setState(() {});
      }
    }
  }

  Widget get _body {
    if (_entriesConnection.isShimmering) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_feedGxC.posts.isEmpty &&
        _entriesConnection.state == PaginationState.DONE_PAGINATING) {
      return Center(child: Text(_appLocalizations.post_feed_noPostsFound));
    }
    return PostsFeedPage(
      onRefresh: _onRefresh,
      feedGxC: _feedGxC,
      mainBloc: context.read<MainBloc>(),
      canPaginate: _entriesConnection.canPaginate,
      paginate: _paginate,
      heroTag: '',
      pageId: widget.bloc.pageId,
    );
  }

  AppBar? get _appBar {
    if (_feedGxC.posts.isEmpty || _entriesConnection.isShimmering) {
      return AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.light,
        iconTheme: const IconThemeData(color: Colors.white),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<SingleChallengeBloc, SingleChallengeState>(
        listener: _listener,
        listenWhen: (prev, current) => current.challengeId == _challenge.id,
        bloc: widget.bloc,
        buildWhen: (previous, current) =>
            current is PaginateUserEntriesState &&
            current.challengeId == _challenge.id &&
            widget.fetchPostsUserId == current.userId,
        builder: (context, state) => Scaffold(
          backgroundColor: Colors.black,
          appBar: _appBar,
          body: _body,
        ),
      );

  @override
  void dispose() {
    _mainBloc.add(
      CancelChallengeConnectionsSubscriptionEvent(
        _challenge.id,
        ChallengeConnectionType.userEntriesConnection,
        userToSearchForId: widget.fetchPostsUserId,
      ),
    );
    super.dispose();
  }
}
