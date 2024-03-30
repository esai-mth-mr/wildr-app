enum Pronoun {
  SHE_HER,
  HE_HIM,
  THEY_THEM,
  NONE,
  OTHER,
}

extension ParsePronoun on Pronoun {
  String toViewString() {
    switch (this) {
      case Pronoun.SHE_HER:
        return 'she/her';
      case Pronoun.HE_HIM:
        return 'he/him';
      case Pronoun.THEY_THEM:
        return 'they/them';
      case Pronoun.NONE:
        return 'None';
      case Pronoun.OTHER:
        return 'Other';
    }
  }

  String toGenderString() {
    switch (this) {
      case Pronoun.SHE_HER:
        return 'FEMALE';
      case Pronoun.HE_HIM:
        return 'MALE';
      case Pronoun.THEY_THEM:
        return 'OTHER';
      case Pronoun.NONE:
        return 'NOT_SPECIFIED';
      case Pronoun.OTHER:
        return 'OTHER';
    }
  }

  String getValue(String? otherString) {
    switch (this) {
      case Pronoun.SHE_HER:
        return 'she/her';
      case Pronoun.HE_HIM:
        return 'he/him';
      case Pronoun.THEY_THEM:
        return 'they/them';
      case Pronoun.NONE:
        return '';
      case Pronoun.OTHER:
        if (otherString == null) throw Exception('Other string not provided');
        return otherString;
    }
  }
}

class PronounGen {
  Pronoun pronoun;
  String? otherString;

  PronounGen(this.pronoun, {this.otherString});
}

PronounGen toPronoun(String input) {
  switch (input) {
    case 'she/her':
      return PronounGen(Pronoun.SHE_HER);
    case 'he/him':
      return PronounGen(Pronoun.HE_HIM);
    case 'they/them':
      return PronounGen(Pronoun.THEY_THEM);
    case '':
      return PronounGen(Pronoun.NONE);
    default:
      return PronounGen(Pronoun.OTHER, otherString: input);
  }
}
