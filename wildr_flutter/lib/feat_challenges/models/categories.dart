class ChallengeCategory {
  final String name;
  final List<ChallengeCategoryType> types;

  ChallengeCategory({
    required this.name,
    required this.types,
  });

  factory ChallengeCategory.fromJson(Map<String, dynamic> json) =>
      ChallengeCategory(
        name: json['name'],
        types: (json['categories'] as List<dynamic>)
            .map((e) => ChallengeCategoryType.fromJson(e))
            .toList(),
      );
}

class ChallengeCategoryType {
  final String id;
  final String value;

  ChallengeCategoryType({
    required this.id,
    required this.value,
  });

  factory ChallengeCategoryType.fromJson(Map<String, dynamic> json) =>
      ChallengeCategoryType(
        id: json['id'],
        value: json['value'],
      );
}
