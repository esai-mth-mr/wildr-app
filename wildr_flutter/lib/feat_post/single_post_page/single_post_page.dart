import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:loader_overlay/loader_overlay.dart';
import 'package:uuid/uuid.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/constants/constants.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_body.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_gxc.dart';
import 'package:wildr_flutter/feat_post/single_post_page/widgets/post_not_found_body.dart';
import 'package:wildr_flutter/gql_isolate_bloc/gql_isolate_bloc.dart';
import 'package:wildr_flutter/gql_isolate_bloc/post_ext/post_events.dart';
import 'package:wildr_flutter/routes.gr.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

void print(dynamic message) {
  debugPrint('[SinglePostPage] $message');
}

class SinglePostPage extends StatefulWidget {
  final String postId;
  final String? commentToNavigateToId;
  final String? replyToNavigateToId;
  final int? postPageIndex;

  SinglePostPage(
    this.postId, {
    Key? key,
    this.commentToNavigateToId,
    this.replyToNavigateToId,
    this.postPageIndex,
  }) : super(key: key ?? ValueKey('${postId}_${const Uuid().v4()}'));

  @override
  SinglePostPageState createState() => SinglePostPageState();
}

class SinglePostPageState extends State<SinglePostPage> {
  late final String _pageId = widget.key?.toString() ??
      '${SINGLE_POST_PAGE_ID}_${widget.postId}_${const Uuid().v4()}';
  late final SinglePostGxC _postGxC = Get.put(SinglePostGxC(), tag: _pageId);
  bool _canNavigateToCommentsPage = true;
  late final double _topPadding = MediaQuery.of(context).padding.top + 60.0.h;
  bool _canShow = false;
  late final _mainBloc = Common().mainBloc(context);
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;
  bool _postNotFound = false;

  @override
  void initState() {
    _postGxC.currentSubIndex = widget.postPageIndex ?? 0;
    super.initState();
    debugPrint('Key = ${widget.key}');
    if (mounted) {
      setState(() {
        shouldAddBottomView = true;
      });
    }
    if (mounted) {
      _mainBloc.add(GetSinglePostEvent(postId: widget.postId, pageId: _pageId));
    }
  }

  Widget _topView() {
    if (_postGxC.currentPost.id.isEmpty) return const SizedBox();
    return Obx(
      () => Padding(
        padding: const EdgeInsets.only(right: 56.0),
        child: Common().feedDotIndicator(_postGxC),
      ),
    );
  }

  Widget _content() {
    if (_postNotFound) {
      return const PostNotFoundErrorBody();
    } else if (_postGxC.currentPost.id.isEmpty) {
      return Container(
        margin: EdgeInsets.only(bottom: _topPadding),
        child: const Center(child: CircularProgressIndicator()),
      );
    }
    return SinglePostPageBody(
      postGxC: _postGxC,
      topPadding: _topPadding,
      initialPageIndex: widget.postPageIndex,
      shouldAddBottomView: shouldAddBottomView,
      context: context,
    );
  }

  bool shouldAddBottomView = false;

  void _mainBlocListener(BuildContext context, MainState state) {
    if (state is GetSinglePostDataUpdateState) {
      print('GetSinglePostDataUpdateState!!');
      if (state.id != _pageId) return;
      if (state.isLoading) return;
      if (state.errorMessage == null && state.post != null) {
        if (_canShow) {
          _postGxC.currentPost = state.post!;
        } else {
          if (state.post!.isDeleted()) {
            _showErrorMessage(_appLocalizations.post_postNoLongerAvailable);
            return;
          }
          _canShow = true;
          _postGxC.currentPost = state.post!;
          if (_canNavigateToCommentsPage &&
              widget.commentToNavigateToId != null &&
              _postGxC.currentPost.isNotDeleted &&
              _postGxC.currentPost.isParentPostNotDeleted) {
            _openCommentsPage();
            _canNavigateToCommentsPage = false;
          }
          if (mounted) {
            setState(() {});
          }
        }
      } else {
        _canNavigateToCommentsPage = false;
        _canShow = true;
        setState(() {
          _postNotFound = true;
        });
      }
    } else if (state is DeletePostState) {
      context.loaderOverlay.hide();
    }
  }

  AppBar _appBar() => AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.light,
        shadowColor: Colors.transparent,
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
        title: _topView(),
        centerTitle: true,
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: WildrColors.bgColorDark,
        appBar: _appBar(),
        body: SafeArea(
          child: BlocListener<MainBloc, MainState>(
            listener: _mainBlocListener,
            child: _content(),
          ),
        ),
      );

  void _showErrorMessage(String errorMessage) {
    Common()
        .showErrorDialog(
          context,
          title: _appLocalizations.post_uhOh,
          description: errorMessage,
        )
        .then((value) => Navigator.of(context).pop());
  }

  void _openCommentsPage() {
    debugPrint('_openCommentsPage');
    if (_postGxC.currentPost.isDeleted()) {
      Common().showErrorSnackBar('Post unavailable', context);
      return;
    }
    if (_postGxC.currentPost.id.isEmpty) return;
    if (mounted) {
      context.pushRoute(
        CommentsPageRoute(
          parent: _postGxC.currentPost,
          commentToNavigateToId: widget.commentToNavigateToId,
          replyToNavigateToId: widget.replyToNavigateToId,
          parentPageId: _pageId,
        ),
      );
    }
  }

  @override
  void dispose() {
    shouldAddBottomView = false;
    _postGxC.currentSubIndex = 0;
    _mainBloc.add(CancelSinglePostSubscriptionEvent(_pageId));
    super.dispose();
  }
}
