class LoginDetails {
  late String? email;

  // late String? password;
  late String? phoneNumber;
  late String? name;
  String? token;
  String? uid;
  int loginType = 0;

  LoginDetails({
    this.email,
    // this.password,
    this.phoneNumber,
    this.name,
    this.loginType = 0,
    this.uid,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {
      'name': name,
      'loginType': loginType,
    };
    if (email != null) {
      json['email'] = email;
      // json['password'] = password;
    }
    if (phoneNumber != null) {
      json['phoneNumber'] = phoneNumber;
    }
    return json;
  }

  LoginDetails.fromJson(Map<String, dynamic> json) {
    email = json['email'];
    // this.password = json['password'];
    name = json['name'];
    phoneNumber = json['phoneNumber'];
    loginType = json['loginType'];
  }
}
