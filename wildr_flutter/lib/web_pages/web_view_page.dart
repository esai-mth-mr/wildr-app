import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:wildr_flutter/common/common.dart';

class WebViewPage extends StatefulWidget {
  const WebViewPage({super.key, this.title = '', required this.url});

  final String title;
  final String url;

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController webViewController;

  @override
  void initState() {
    webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(widget.url));
    super.initState();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: Common().appbarWithActions(title: widget.title),
        body: WebViewWidget(controller: webViewController),
      );
}
