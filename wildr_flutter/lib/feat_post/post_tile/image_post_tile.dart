import 'package:flutter/material.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class ImagePostTileCard extends StatelessWidget {
  final MainBloc? mainBloc;
  final Post post;

  const ImagePostTileCard(
    this.post, {
    this.mainBloc,
    super.key,
  });

  @override
  Widget build(BuildContext context) =>
      Common().imageView(post.thumbnail ?? '');
}
