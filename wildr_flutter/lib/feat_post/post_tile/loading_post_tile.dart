import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';

class LoadingPostTile extends StatelessWidget {
  const LoadingPostTile({super.key});

  @override
  Widget build(BuildContext context) => Common().wrapInShimmer(
      Container(color: Colors.white),
      context: context,
    );
}
