class CreateQuery {
  static String createQuery(String queryStr, List<String> fragments) {
    String str = '';
    for (final element in fragments) {
      str += '$element\n';
    }
    // ignore: join_return_with_assignment
    str += queryStr;
    return str;
  }
}
