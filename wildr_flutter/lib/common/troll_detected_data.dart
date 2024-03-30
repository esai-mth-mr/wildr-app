class PostTrollDetectedData {
  List<TrollData> results;
  List<int> indices;
  String? message;

  PostTrollDetectedData(this.results, this.indices, this.message);
}

class TrollDetectedData {
  String? message;
  TrollData? data;
  double? negativeCount;

  TrollDetectedData({
    required this.message,
    required this.data,
  }) : negativeCount = data?.confidence?.negative;
}

class TrollData {
  String? text;
  String? sentiment;
  TrollDetectionConfidence? confidence;

  TrollData.fromMap(Map<String, dynamic>? map) {
    if (map == null) return;
    text = map['text'];
    sentiment = map['sentiment'];
    confidence = TrollDetectionConfidence.fromMap(map['confidence']);
  }
}

class TrollDetectionConfidence {
  double negative = 0;
  double positive = 0;

  TrollDetectionConfidence.fromMap(Map<String, dynamic>? map) {
    if (map == null) return;
    positive = ((map['positive'] ?? 0) as num).toDouble();
    negative = ((map['negative'] ?? 0) as num).toDouble();
  }
}
