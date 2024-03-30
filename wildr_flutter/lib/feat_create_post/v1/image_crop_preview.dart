import 'dart:io';

import 'package:flutter/material.dart';
import 'package:palette_generator/palette_generator.dart';
import 'package:photo_view/photo_view.dart';

class ImageCropPreview extends StatefulWidget {
  final String filePath;
  final GlobalKey? previewContainer;

  const ImageCropPreview({
    super.key,
    required this.filePath,
    required this.previewContainer,
  });

  @override
  ImageCropPreviewState createState() => ImageCropPreviewState();
}

class ImageCropPreviewState extends State<ImageCropPreview> {
  PaletteGenerator? paletteGenerator;

  @override
  void initState() {
    super.initState();
    _initPaletteGenerator();
  }

  Future<void> _initPaletteGenerator() async {
    paletteGenerator = await PaletteGenerator.fromImageProvider(
      FileImage(File(widget.filePath)),
    );
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
      key: widget.previewContainer,
      child: PhotoView(
        backgroundDecoration: BoxDecoration(
          color: paletteGenerator?.dominantColor?.color,
        ),
        maxScale: 5.0,
        enablePanAlways: false,
        imageProvider: FileImage(File(widget.filePath)),
      ),
    );
}
