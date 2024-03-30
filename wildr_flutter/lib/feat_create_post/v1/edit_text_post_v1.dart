import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_create_post/gxc/create_post_gxc.dart';
import 'package:wildr_flutter/feat_create_post/v1/create_post_page_v1.dart';

class EditTextPostV1 extends StatelessWidget {
  final CreatePostGxC createPostGxC;
  final TextPostData textPostData;

  const EditTextPostV1({
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
        child: CreateTextTabV1(
          key: const ValueKey('Editing'),
          focusNode: FocusNode(),
          createPostGxC: createPostGxC,
          isEditMode: true,
          editTextPostData: textPostData,
        ),
      ),
    );
}
