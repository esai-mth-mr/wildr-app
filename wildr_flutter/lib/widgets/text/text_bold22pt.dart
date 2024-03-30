import 'package:flutter/material.dart';

class TextBold25pt extends Text {
  const TextBold25pt(super.data, {super.key});

  @override
  Widget build(BuildContext context) => Text(
      data ?? '',
      style: const TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
    );
}
