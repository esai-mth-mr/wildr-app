import 'package:flutter/material.dart';

class ContactSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final Function(String) onChanged;

  const ContactSearchBar(this.controller, {super.key, required this.onChanged});

  @override
  Widget build(BuildContext context) => TextField(
      onChanged: (value) => onChanged(value),
      controller: controller,
      decoration: const InputDecoration(
        labelText: 'Search',
        hintText: 'Search',
        prefixIcon: Icon(Icons.search),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(25.0)),
        ),
      ),
    );
}
