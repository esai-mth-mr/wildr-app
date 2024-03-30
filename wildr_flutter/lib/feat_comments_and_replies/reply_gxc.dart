import 'package:get/get.dart';
import 'package:wildr_flutter/home/model/reply.dart';

class ReplyGxC extends GetxController {
  RxBool isSendingReply = false.obs;
  Rx<RxList<Reply>> list = RxList<Reply>().obs;

  String? postId;
  String? challengeId;

  //var parentComment = Comment.empty().obs;
  var selectedIndex = -1;

  void clearAll() {
    isSendingReply.value = false;
    list.value.clear();
    //parentComment.value = Comment.empty();
  }
}
