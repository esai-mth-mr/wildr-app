import 'dart:io';

import 'package:flutter/material.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/common/common.dart';
import 'package:wildr_flutter/main_common.dart';
import 'package:wildr_flutter/shared_pref/pref_keys.dart';
import 'package:wildr_flutter/shared_pref/prefs.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';
import 'package:wildr_flutter/widgets/wildr_logo/logo.dart';

enum ServerUrl { prod, localhost, localhost_yash, dev, other, none }

class SelectServerUrl extends StatelessWidget {
  const SelectServerUrl({super.key});

  @override
  Widget build(BuildContext context) => const MaterialApp(
      title: 'Wildr',
      home: ChangeServerUrlPage(
          // isFromSettings: false,
          ),
    );
}

class ChangeServerUrlPage extends StatefulWidget {
  // final bool isFromSettings;

  const ChangeServerUrlPage({super.key} /* {this.isFromSettings = false} */);

  @override
  State<ChangeServerUrlPage> createState() => _ChangeServerUrlPageState();
}

class _ChangeServerUrlPageState extends State<ChangeServerUrlPage> {
  ServerUrl urlEnum = ServerUrl.prod;

  String? _serverUrl = Environment.PROD.getUrl();

  TextEditingController textEditingController = TextEditingController(
    text: 'http://192.168.1.6:4000/graphql',
  );

  void clear(BuildContext context) {
    Prefs.remove(PrefKeys.kCurrentUrl);
    Common().mainBloc(context).add(ServerUrlChangedEvent());
    Navigator.pop(context, true);
  }

  void _onSubmit() {
    if (_serverUrl != null && _serverUrl!.isNotEmpty) {
      Prefs.setString(PrefKeys.kCurrentUrl, _serverUrl!);
      // if (widget.isFromSettings) {
      Common().showSnackBar(
        context,
        'Url changed to $_serverUrl',
        millis: 2000,
      );
      Common().mainBloc(context).add(ServerUrlChangedEvent());
      //Navigator.pop(context, true);
      Navigator.pop(context, true);
      Navigator.pop(context, true);
      // } else {
      //   Common().pushReplacement(ConsentPage(), context);
      // }
    } else {
      clear(context);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      body: SafeArea(
        top: false,
        child: Center(
          child: SingleChildScrollView(
            child: SizedBox(
              height: MediaQuery.of(context).size.height -
                  MediaQuery.of(context).padding.bottom -
                  MediaQuery.of(context).padding.top,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Padding(
                    padding: EdgeInsets.only(top: 2.0.w),
                    child: const Logo(),
                  ),
                  Text(
                    'Welcome to Wildr!',
                    style: TextStyle(
                      color: WildrColors.primaryColor,
                      fontSize: 36.0.sp,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: EdgeInsets.only(left: 35.0.w),
                        child: Text(
                          'Please select a server url...',
                          style: TextStyle(
                            fontSize: 15.0.sp,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.start,
                        ),
                      ),
                      SizedBox(
                        height: 20..h,
                      ),
                      ListTile(
                        title: const Text('Prod'),
                        leading: Radio<ServerUrl>(
                          value: ServerUrl.prod,
                          groupValue: urlEnum,
                          activeColor: WildrColors.primaryColor,
                          onChanged: (value) {
                            setState(() {
                              urlEnum = value!;
                              _serverUrl = Environment.PROD.getUrl();
                            });
                          },
                        ),
                        onTap: () {
                          setState(() {
                            urlEnum = ServerUrl.prod;
                            _serverUrl = Environment.PROD.getUrl();
                          });
                        },
                      ),
                      ListTile(
                        title: const Text('Dev'),
                        leading: Radio<ServerUrl>(
                          value: ServerUrl.dev,
                          activeColor: WildrColors.primaryColor,
                          groupValue: urlEnum,
                          onChanged: (value) {
                            setState(() {
                              urlEnum = value!;
                              _serverUrl = Environment.DEV2.getUrl();
                            });
                          },
                        ),
                        onTap: () {
                          setState(() {
                            urlEnum = ServerUrl.dev;
                            _serverUrl = Environment.DEV2.getUrl();
                          });
                        },
                      ),
                      ListTile(
                        title: const Text('localhost'),
                        leading: Radio<ServerUrl>(
                          value: ServerUrl.localhost,
                          groupValue: urlEnum,
                          activeColor: WildrColors.primaryColor,
                          onChanged: (value) {
                            setState(() {
                              urlEnum = value!;
                              _setToLocalMachine();
                            });
                          },
                        ),
                        onTap: () {
                          setState(() {
                            urlEnum = ServerUrl.localhost;
                            _setToLocalMachine();
                          });
                        },
                      ),
                      ListTile(
                        title: const Text("Yash's mac"),
                        leading: Radio<ServerUrl>(
                          value: ServerUrl.localhost_yash,
                          groupValue: urlEnum,
                          activeColor: WildrColors.primaryColor,
                          onChanged: (value) {
                            setState(() {
                              urlEnum = value!;
                              _setToYashMachine();
                            });
                          },
                        ),
                        onTap: () {
                          setState(() {
                            urlEnum = ServerUrl.localhost_yash;
                            _setToYashMachine();
                          });
                        },
                      ),
                      Padding(
                        padding: EdgeInsets.only(left: 30.0.w, right: 30.0.w),
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              urlEnum = ServerUrl.other;
                              _serverUrl = textEditingController.text;
                            });
                          },
                          child: TextFormField(
                            autocorrect: false,
                            keyboardType: TextInputType.url,
                            controller: textEditingController,
                            onChanged: (value) {
                              urlEnum = ServerUrl.none;
                              if (urlEnum != ServerUrl.other) {
                                setState(() {
                                  urlEnum = ServerUrl.other;
                                });
                              }
                            },
                            onFieldSubmitted: (value) {
                              debugPrint('OnSubmitted');
                              setState(() {
                                urlEnum = ServerUrl.other;
                                _serverUrl = value;
                              });
                            },
                            textInputAction: TextInputAction.done,
                            decoration: InputDecoration(
                              labelText: 'Custom Url',
                              floatingLabelBehavior: FloatingLabelBehavior.auto,
                              floatingLabelStyle: const TextStyle(
                                color: WildrColors.primaryColor,
                                fontWeight: FontWeight.w600,
                              ),
                              labelStyle: TextStyle(
                                fontSize: 18,
                                color: WildrColors.textColorStrong(),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 5,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      TextButton(
                        style: ButtonStyle(
                          foregroundColor: MaterialStateProperty.all(
                            WildrColors.primaryColor,
                          ),
                        ),
                        onPressed: _onSubmit,
                        child: Text(
                          'Submit',
                          style: TextStyle(fontSize: 18.0.sp),
                        ),
                      ),
                      TextButton(
                        style: ButtonStyle(
                          foregroundColor: MaterialStateProperty.all(
                            WildrColors.primaryColor,
                          ),
                        ),
                        onPressed: () => clear(context),
                        child: Text(
                          "Don't know,\nDon't care!",
                          style: TextStyle(fontSize: 15.0.sp),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

  void _setToLocalMachine() {
    String host;
    if (Platform.isAndroid) {
      host = '10.0.2.2';
    } else {
      host = 'localhost';
    }
    _serverUrl = 'http://$host:4000/graphql';
  }

  void _setToYashMachine() {
    _serverUrl = 'http://192.168.86.239:4000/graphql';
  }
}
