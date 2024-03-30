import 'package:wildr_flutter/common/smart_text/smart_text_segment.dart';
import 'package:wildr_flutter/home/model/author.dart';
import 'package:wildr_flutter/home/model/timestamp.dart';

class Reply {
  late Author author;
  String? body;
  late String id;

  List<Segment>? segments;

  late String parentCommentId;

  late TimeStamp ts;

  bool hasLiked = false;
  int likeCount = 0;

  bool willBeDeleted = false;

  Reply.forActivity(Map<String, dynamic> node) {
    id = node['id'] ?? '';
    final body = node['body'];
    if (body == null) {
      return;
    }
    if (body['segments'] != null) {
      final List listOfSegments = body['segments'];
      segments =
          listOfSegments.map((element) => Segment.fromJson(element)).toList();
    }
    this.body = body['body'] ?? '';
  }

  Reply.fromAddReply(Map<String, dynamic> data, this.parentCommentId) {
    final c = data['addReply']['reply'];
    id = c['id'];
    author =
        c['author'] == null ? Author.empty() : Author.fromJson(c['author']);
    _parseBodyFromNode(c);
    ts = TimeStamp.fromJson(c['ts']);
  }

  Reply.fromEdge(Map<String, dynamic> edge) {
    final node = edge['node'];
    id = node['id'];
    ts = TimeStamp.fromJson(node['ts']);
    author = Author.fromJson(node['author']);
    _parseBodyFromNode(node);
    final replyStats = node['replyStats'];
    likeCount = replyStats['likeCount'];
    final replyContext = node['replyContext'];
    if (replyContext != null) {
      hasLiked = replyContext['liked'] ?? false;
    }
  }

  void _parseBodyFromNode(Map<String, dynamic> node) {
    final body = node['body'];
    if (body['segments'] != null) {
      final List listOfSegments = body['segments'];
      segments =
          listOfSegments.map((element) => Segment.fromJson(element)).toList();
    } else {
      this.body = body['body'] ?? '';
    }
  }
}
