// Use a lambda to map an object to its unique identifier.
// someList.unique((x) => x.id);
// Don't use a lambda for primitive/hashable types.
// someList.unique();
// ignore_for_file: cascade_invocations, avoid_positional_boolean_parameters

extension Unique<E, Id> on List<E> {
  List<E> unique([Id Function(E element)? id, bool inplace = true]) {
    final ids = <dynamic>{};
    final list = inplace ? this : List<E>.from(this);
    list.retainWhere((x) => ids.add(id != null ? id(x) : x as Id));
    return list;
  }
}
