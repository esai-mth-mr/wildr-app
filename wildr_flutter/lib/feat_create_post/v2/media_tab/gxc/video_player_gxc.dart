import 'package:get/get.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerGxC extends GetxController {
  final RxDouble _progress = 0.0.obs;
  final RxBool _isPlaying = false.obs;
  final Rx<Duration> _currentPosition = Duration.zero.obs;

  double get progress => _progress.value;

  bool get isPlaying => _isPlaying.value;

  Duration get currentPosition => _currentPosition.value;

  void syncWithVideoPlayerController(
    VideoPlayerController? videoPlayerController,
  ) {
    if (videoPlayerController != null) {
      _progress.value = videoPlayerController.value.position.inMilliseconds /
          videoPlayerController.value.duration.inMilliseconds;

      _isPlaying.value = videoPlayerController.value.isPlaying;
      _currentPosition.value = videoPlayerController.value.position;
    }
  }
}
