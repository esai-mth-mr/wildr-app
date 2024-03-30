import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

class BuildNumber extends StatefulWidget {
  const BuildNumber({super.key});

  @override
  BuildNumberState createState() => BuildNumberState();
}

class BuildNumberState extends State<BuildNumber> {
  PackageInfo _packageInfo = PackageInfo(
    appName: 'Unknown',
    packageName: 'Unknown',
    version: 'Unknown',
    buildNumber: 'Unknown',
    buildSignature: 'Unknown',
  );

  @override
  void initState() {
    super.initState();
    _initPackageInfo();
  }

  Future<void> _initPackageInfo() async {
    final info = await PackageInfo.fromPlatform();
    setState(() {
      _packageInfo = info;
    });
  }

  @override
  Widget build(BuildContext context) => Text(
        'Version: ${_packageInfo.appName} '
        'v${_packageInfo.version} (${_packageInfo.buildNumber})',
        style: const TextStyle(color: Colors.grey),
      );
}
