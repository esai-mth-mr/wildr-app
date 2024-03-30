class PostCategory {
  final String id;
  final String value;
  int cellCount = 1;

  PostCategory(this.id, this.value);

  @override
  String toString() => 'PostCategory{id: $id,'
      ' value: $value, cellCount: $cellCount}';
}
