import 'package:flutter/material.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_post/model/post.dart';

class VideoPostTileCard extends StatelessWidget {
  final MainBloc? mainBloc;
  final Post post;

  const VideoPostTileCard(
    this.post, {
    this.mainBloc,
    super.key,
  });

  @override
  Widget build(BuildContext context) => Stack(
      children: [
        Common().imageView(post.thumbnail ?? ''),
        const Align(
          child: Padding(
            padding: EdgeInsets.only(right: 5, bottom: 5),
            child: WildrIcon(
              WildrIcons.play_alt_filled,
              color: Colors.white,
              size: 15,
            ),
          ),
        ),
      ],
    );
}
