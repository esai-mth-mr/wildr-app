// ignore_for_file: lines_longer_than_80_chars

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_body.dart';
import 'package:wildr_flutter/feat_post/single_post_page/single_post_gxc.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PreviewRepostPage extends StatefulWidget {
  final Post repost;

  const PreviewRepostPage(this.repost, {super.key});

  @override
  State<PreviewRepostPage> createState() => _PreviewRepostPageState();
}

class _PreviewRepostPageState extends State<PreviewRepostPage> {
  late final SinglePostGxC _postGxC;
  late final double _topPadding = MediaQuery.of(context).padding.top + 60.0.h;
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    _postGxC = Get.put(SinglePostGxC());
    _postGxC.currentPost = widget.repost;
    super.initState();
  }

  AppBar _appBar() => AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.light,
        shadowColor: Colors.transparent,
        backgroundColor: Colors.black,
        title: Text(
          _appLocalizations.createPost_cap_repost,
          style: const TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
      );

  Widget _titleMessage() => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Text.rich(
          TextSpan(
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
            children: [
              TextSpan(text: _appLocalizations.createPost_originalPostBy),
              TextSpan(
                text:
                    '@${_postGxC.currentPost.repostMeta?.parentPost?.author.handle}',
                recognizer: TapGestureRecognizer()
                  ..onTap = () => Common().openProfilePage(
                        context,
                        _postGxC.currentPost.repostMeta?.parentPost?.author
                                .id ??
                            '',
                        author:
                            _postGxC.currentPost.repostMeta?.parentPost?.author,
                      ),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: WildrColors.bgColorDark,
        appBar: _appBar(),
        body: SafeArea(
          child: SizedBox(
            height: MediaQuery.of(context).size.height,
            child: Column(
              children: [
                _titleMessage(),
                if (_postGxC.currentPost.id.isNotEmpty)
                  Obx(() => Common().feedDotIndicator(_postGxC)),
                Expanded(
                  child: SinglePostPageBody(
                    postGxC: _postGxC,
                    context: context,
                    topPadding: _topPadding,
                    shouldAddBottomView: false,
                    shouldEnableDoubleTapToLike: false,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
