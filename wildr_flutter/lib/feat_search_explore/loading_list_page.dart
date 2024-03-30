import 'package:flutter/material.dart';
import 'package:wildr_flutter/common/common.dart';

class LoadingListPage extends StatefulWidget {
  const LoadingListPage({super.key});

  @override
  State<LoadingListPage> createState() => _LoadingListPageState();
}

class _LoadingListPageState extends State<LoadingListPage> {
  final bool _enabled = true;

  @override
  Widget build(BuildContext context) => SizedBox(
      width: double.infinity,
      child: Column(
        children: <Widget>[
          Expanded(
            child: Common().wrapInShimmer(
              ListView.builder(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemBuilder: (_, __) => ListTile(
                  dense: true,
                  leading: const CircleAvatar(
                    radius: 24,
                    backgroundColor: Colors.white,
                  ),
                  title: Container(
                    width: double.infinity,
                    height: 14.0,
                    color: Colors.white,
                  ),
                  subtitle: Container(
                    width: double.infinity,
                    height: 8.0,
                    color: Colors.white,
                  ),
                ),
                itemCount: 6,
              ),
              enabled: _enabled,
              context: context,
            ),
          ),
        ],
      ),
    );
}
