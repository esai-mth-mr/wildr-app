import 'package:flutter/material.dart';
import 'package:wildr_flutter/feat_feed/feed_gxc.dart';
import 'package:wildr_flutter/feat_post/post_hamburger_menu.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class PostNotFoundErrorBody extends StatelessWidget {
  const PostNotFoundErrorBody({super.key});

  @override
  Widget build(BuildContext context) => Stack(
        alignment: Alignment.center,
        children: [
          const Text(
            'Post not found',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: WildrColors.gray700,
            ),
          ),
          Align(
            alignment: Alignment.bottomRight,
            child: Padding(
              padding: const EdgeInsets.only(
                right: 10,
                bottom: 16,
              ),
              child: PostHamburgerMenu(
                feedGxC: FeedGxC(),
                pageId: '',
                postNotFound: true,
              ),
            ),
          ),
        ],
      );
}
