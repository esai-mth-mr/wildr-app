import 'package:flutter/material.dart';

class Text22pt extends Text {
  const Text22pt(super.data, {super.key});

  @override
  Widget build(BuildContext context) => Text(
      data ?? '',
      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.normal),
    );
}
