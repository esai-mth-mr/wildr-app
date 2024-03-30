class OnboardingStats {
  bool innerCircle = true;
  bool commentReplyLikes = true;
  bool challenges = true;
  bool challengeEducation = true;

  OnboardingStats();

  Map<String, dynamic> toJson() => {
        'innerCircle': innerCircle,
        'commentReplyLikes': commentReplyLikes,
        'challenges': challenges,
        'challengeEducation': challengeEducation,
      };

  OnboardingStats.fromJson(Map<String, dynamic>? map) {
    if (map != null) {
      innerCircle = map['innerCircle'] ?? innerCircle;
      commentReplyLikes = map['commentReplyLikes'] ?? commentReplyLikes;
      challenges = map['challenges'] ?? challenges;
      challengeEducation = map['challengeEducation'] ?? challengeEducation;
    }
  }

  @override
  String toString() => 'OnboardingStats{innerCircle: $innerCircle,'
      ' commentReplyLikes: $commentReplyLikes,'
      ' challenges: $challenges, '
      'challengeEducation: $challengeEducation}';
}
