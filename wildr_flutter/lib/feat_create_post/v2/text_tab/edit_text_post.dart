import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/create_text_post.dart';

class EditTextPostPage extends StatelessWidget {
  final CreatePostGxC createPostGxC;
  final TextPostData textPostData;

  const EditTextPostPage({
    required this.createPostGxC,
    required this.textPostData,
    super.key,
  });

  @override
  Widget build(BuildContext context) => Scaffold(
      resizeToAvoidBottomInset: false,
      extendBodyBehindAppBar: true,
      appBar: AppBar(),
      body: SafeArea(
        child: CreateTextPost(
          key: const ValueKey('Editing'),
          createPostGxC: createPostGxC,
          isEditMode: true,
          editTextPostData: textPostData,
        ),
      ),
    );
}
