import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_common.dart';
import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PreviewTextPostPage extends StatefulWidget {
  final List<Segment> segments;
  final CreatePostGxC createPostGxC;

  const PreviewTextPostPage({
    required this.segments,
    required this.createPostGxC,
    super.key,
  });

  @override
  PreviewTextPostPageState createState() => PreviewTextPostPageState();
}

class PreviewTextPostPageState extends State<PreviewTextPostPage> {
  late final AppLocalizations _appLocalizations = AppLocalizations.of(context)!;

  @override
  void initState() {
    super.initState();
  }

  void _editIt() {
    Navigator.of(context).pop();
  }

  Widget _editButton() => IconButton(
        tooltip: _appLocalizations.createPost_previewAsViewedByFollowersMessage,
        icon: const FaIcon(
          FontAwesomeIcons.penToSquare,
          color: WildrColors.primaryColor,
          size: 30,
        ),
        onPressed: _editIt,
      );

  void _addAnotherTextPostPage() {}

  Widget _addAnotherTextPostPageButton() => IconButton(
        tooltip: _appLocalizations.createPost_addAnotherTextPage,
        icon: const WildrIcon(
          WildrIcons.add_document_filled,
          color: WildrColors.primaryColor,
          size: 30,
        ),
        onPressed: _addAnotherTextPostPage,
      );

  void _onNext() {}

  Widget _bottomButtons() => Container(
        color: Colors.black12,
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          bottom: MediaQuery.of(context).padding.bottom,
        ),
        child: Row(
          children: [
            _editButton(),
            Expanded(child: Container()),
            _addAnotherTextPostPageButton(),
            TextButton(
              style: Common().buttonStyle(),
              onPressed: _onNext,
              child: Text(
                _appLocalizations.comm_cap_next,
                style: Common().buttonTextStyle(),
              ),
            ),
          ],
        ),
      );

  Widget _textPreview() => Padding(
        padding: const EdgeInsets.only(
          left: 10,
          right: 10, /*bottom: bottomPadding + 56.0.w, top: topPadding */
        ),
        child: Center(
          child: SmartTextCommon().getAutoResizeText(
            segmentsOrCaption: widget.segments,
            context: context,
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          elevation: 0.1,
          shadowColor: Colors.black12,
          // shadowColor: Colors.transparent,
          backgroundColor: Colors.transparent,
          title: Text(_appLocalizations.createPost_textPostPreview),
        ),
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [Expanded(child: _textPreview()), _bottomButtons()],
          ),
        ),
      );
}
