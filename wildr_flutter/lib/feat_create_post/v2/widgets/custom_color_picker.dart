import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/feat_create_post/v2/text_tab/gxc/text_post_background_gxc.dart';

class _SliderIndicatorPainter extends CustomPainter {
  final double position;

  _SliderIndicatorPainter(this.position);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawCircle(
      Offset(position, size.height / 2),
      12,
      Paint()..color = Colors.black,
    );
  }

  @override
  bool shouldRepaint(_SliderIndicatorPainter old) => true;
}

class ColorPicker extends StatefulWidget {
  final double width;

  const ColorPicker(this.width, {super.key});

  @override
  ColorPickerState createState() => ColorPickerState();
}

class ColorPickerState extends State<ColorPicker> {
  final List<Color> _colors = [
    const Color.fromARGB(255, 255, 0, 0),
    const Color.fromARGB(255, 255, 128, 0),
    const Color.fromARGB(255, 255, 255, 0),
    const Color.fromARGB(255, 128, 255, 0),
    const Color.fromARGB(255, 0, 255, 0),
    const Color.fromARGB(255, 0, 255, 128),
    const Color.fromARGB(255, 0, 255, 255),
    const Color.fromARGB(255, 0, 128, 255),
    const Color.fromARGB(255, 0, 0, 255),
    const Color.fromARGB(255, 127, 0, 255),
    const Color.fromARGB(255, 255, 0, 255),
    const Color.fromARGB(255, 255, 0, 127),
    const Color.fromARGB(255, 128, 128, 128),
  ];
  double _colorSliderPosition = 0;
  late double _shadeSliderPosition;
  late Color _currentColor;
  late Color _shadedColor;
  final TextPostBackgroundGxc _textPostBackgroundGxc =
      Get.put(TextPostBackgroundGxc());

  @override
  void initState() {
    super.initState();
    _currentColor = _calculateSelectedColor(_colorSliderPosition);
    _shadeSliderPosition = widget.width / 2; //center the shader selector
    _shadedColor = _calculateShadedColor(_shadeSliderPosition);
  }

  void _colorChangeHandler(double position) {
    if (position > widget.width) {
      _colorSliderPosition = widget.width;
    } else if (position < 0) {
      _colorSliderPosition = 0;
    } else {
      _colorSliderPosition = position;
    }
    setState(() {
      _colorSliderPosition = position;
      _currentColor = _calculateSelectedColor(_colorSliderPosition);
      _shadedColor = _calculateShadedColor(_shadeSliderPosition);
      _textPostBackgroundGxc
        ..textPostBGEnum = TextPostBackgroundType.CUSTOM
        ..textPostCustomBGColor = _shadedColor;
    });
  }

  void _shadeChangeHandler(double position) {
    if (position > widget.width) {
      _shadeSliderPosition = widget.width;
    } else if (position < 0) {
      _shadeSliderPosition = 0;
    } else {
      _shadeSliderPosition = position;
    }
    setState(() {
      _shadedColor = _calculateShadedColor(_shadeSliderPosition);
      _textPostBackgroundGxc
        ..textPostBGEnum = TextPostBackgroundType.CUSTOM
        ..textPostCustomBGColor = _shadedColor;
    });
  }

  Color _calculateShadedColor(double position) {
    final double ratio = position / widget.width;
    if (ratio > 0.5) {
      //Calculate new color (values converge to 255 to make the color lighter)
      final int redVal = _currentColor.red != 255
          ? (_currentColor.red +
                  (255 - _currentColor.red) * (ratio - 0.5) / 0.5)
              .round()
          : 255;
      final int greenVal = _currentColor.green != 255
          ? (_currentColor.green +
                  (255 - _currentColor.green) * (ratio - 0.5) / 0.5)
              .round()
          : 255;
      final int blueVal = _currentColor.blue != 255
          ? (_currentColor.blue +
                  (255 - _currentColor.blue) * (ratio - 0.5) / 0.5)
              .round()
          : 255;
      return Color.fromARGB(255, redVal, greenVal, blueVal);
    } else if (ratio < 0.5) {
      //Calculate new color (values converge to 0 to make the color darker)
      final int redVal = _currentColor.red != 0
          ? (_currentColor.red * ratio / 0.5).round()
          : 0;
      final int greenVal = _currentColor.green != 0
          ? (_currentColor.green * ratio / 0.5).round()
          : 0;
      final int blueVal = _currentColor.blue != 0
          ? (_currentColor.blue * ratio / 0.5).round()
          : 0;
      return Color.fromARGB(255, redVal, greenVal, blueVal);
    } else {
      //return the base color
      return _currentColor;
    }
  }

  Color _calculateSelectedColor(double position) {
    //determine color
    final double positionInColorArray =
        position / widget.width * (_colors.length - 1);
    final int index = positionInColorArray.truncate();
    final double remainder = positionInColorArray - index;
    if (remainder == 0.0) {
      _currentColor = _colors[index];
    } else {
      //calculate new color
      final int redValue = _colors[index].red == _colors[index + 1].red
          ? _colors[index].red
          : (_colors[index].red +
                  (_colors[index + 1].red - _colors[index].red) * remainder)
              .round();
      final int greenValue = _colors[index].green == _colors[index + 1].green
          ? _colors[index].green
          : (_colors[index].green +
                  (_colors[index + 1].green - _colors[index].green) * remainder)
              .round();
      final int blueValue = _colors[index].blue == _colors[index + 1].blue
          ? _colors[index].blue
          : (_colors[index].blue +
                  (_colors[index + 1].blue - _colors[index].blue) * remainder)
              .round();
      _currentColor = Color.fromARGB(255, redValue, greenValue, blueValue);
    }
    return _currentColor;
  }

  @override
  Widget build(BuildContext context) => Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Center(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragStart: (details) {
                _colorChangeHandler(details.localPosition.dx);
              },
              onHorizontalDragUpdate: (details) {
                _colorChangeHandler(details.localPosition.dx);
              },
              onTapDown: (details) {
                _colorChangeHandler(details.localPosition.dx);
              },
              //This outside padding makes it much easier to grab the
              // slider because the gesture detector has
              // the extra padding to recognize gestures inside of
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 15),
                child: Container(
                  width: widget.width,
                  height: 15,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    gradient: LinearGradient(colors: _colors),
                  ),
                  child: CustomPaint(
                    painter: _SliderIndicatorPainter(_colorSliderPosition),
                  ),
                ),
              ),
            ),
          ),
          Center(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragStart: (details) {
                _shadeChangeHandler(details.localPosition.dx);
              },
              onHorizontalDragUpdate: (details) {
                _shadeChangeHandler(details.localPosition.dx);
              },
              onTapDown: (details) {
                _shadeChangeHandler(details.localPosition.dx);
              },
              child: Padding(
                padding: const EdgeInsets.only(top: 15),
                child: Container(
                  width: widget.width,
                  height: 15,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    gradient: LinearGradient(
                      colors: [Colors.black, _currentColor, Colors.white],
                    ),
                  ),
                  child: CustomPaint(
                    painter: _SliderIndicatorPainter(_shadeSliderPosition),
                  ),
                ),
              ),
            ),
          ),
        ],
      );
}
