import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AuthorWithAvatarRow extends StatelessWidget {
  final Author? author;
  final int? type;

  const AuthorWithAvatarRow({
    super.key,
    required this.author,
    this.type,
  });

  Widget _avatarFromAuthor(BuildContext context) => Common().avatarFromAuthor(
      context,
      author,
      radius: 10,
      shouldNavigateToCurrentUser: false,
      shouldShowRing: false,
    );

  Widget _authorHandle() => Flexible(
      child: Text(
        author?.handle ?? '--',
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: type == 1 ? null : WildrColors.white,
          shadows: type == 1
              ? null
              : [
                  Shadow(
                    blurRadius: 3,
                    offset: const Offset(0.5, 0.5),
                    color: WildrColors.black.withOpacity(0.6),
                  ),
                ],
        ),
      ),
    );

  @override
  Widget build(BuildContext context) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (author != null) _avatarFromAuthor(context),
        const SizedBox(width: 6),
        _authorHandle(),
      ],
    );

  String getInitials(String? name) {
    if (name == null || name.isEmpty) return '';

    final names = name.split(' ');
    if (names.length == 1) {
      return names.first.substring(0, 1).toUpperCase();
    } else {
      return '${names.first.substring(0, 1)}${names.last.substring(0, 1)}'
          .toUpperCase();
    }
  }
}
