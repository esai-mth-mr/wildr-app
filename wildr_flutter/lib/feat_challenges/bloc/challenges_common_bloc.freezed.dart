// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'challenges_common_bloc.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#custom-getters-and-methods');

/// @nodoc
mixin _$ChallengesCommonEvent {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() getCategories,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? getCategories,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? getCategories,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_GetCategories value) getCategories,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_GetCategories value)? getCategories,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_GetCategories value)? getCategories,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChallengesCommonEventCopyWith<$Res> {
  factory $ChallengesCommonEventCopyWith(ChallengesCommonEvent value,
          $Res Function(ChallengesCommonEvent) then) =
      _$ChallengesCommonEventCopyWithImpl<$Res, ChallengesCommonEvent>;
}

/// @nodoc
class _$ChallengesCommonEventCopyWithImpl<$Res,
        $Val extends ChallengesCommonEvent>
    implements $ChallengesCommonEventCopyWith<$Res> {
  _$ChallengesCommonEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$_GetCategoriesCopyWith<$Res> {
  factory _$$_GetCategoriesCopyWith(
          _$_GetCategories value, $Res Function(_$_GetCategories) then) =
      __$$_GetCategoriesCopyWithImpl<$Res>;
}

/// @nodoc
class __$$_GetCategoriesCopyWithImpl<$Res>
    extends _$ChallengesCommonEventCopyWithImpl<$Res, _$_GetCategories>
    implements _$$_GetCategoriesCopyWith<$Res> {
  __$$_GetCategoriesCopyWithImpl(
      _$_GetCategories _value, $Res Function(_$_GetCategories) _then)
      : super(_value, _then);
}

/// @nodoc

class _$_GetCategories extends _GetCategories {
  const _$_GetCategories() : super._();

  @override
  String toString() {
    return 'ChallengesCommonEvent.getCategories()';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$_GetCategories);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() getCategories,
  }) {
    return getCategories();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? getCategories,
  }) {
    return getCategories?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? getCategories,
    required TResult orElse(),
  }) {
    if (getCategories != null) {
      return getCategories();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_GetCategories value) getCategories,
  }) {
    return getCategories(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_GetCategories value)? getCategories,
  }) {
    return getCategories?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_GetCategories value)? getCategories,
    required TResult orElse(),
  }) {
    if (getCategories != null) {
      return getCategories(this);
    }
    return orElse();
  }
}

abstract class _GetCategories extends ChallengesCommonEvent {
  const factory _GetCategories() = _$_GetCategories;
  const _GetCategories._() : super._();
}

/// @nodoc
mixin _$ChallengesCommonState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() categoriesLoading,
    required TResult Function(String errorMessage) categoriesError,
    required TResult Function(List<ChallengeCategory> categories)
        categoriesSuccess,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? categoriesLoading,
    TResult? Function(String errorMessage)? categoriesError,
    TResult? Function(List<ChallengeCategory> categories)? categoriesSuccess,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? categoriesLoading,
    TResult Function(String errorMessage)? categoriesError,
    TResult Function(List<ChallengeCategory> categories)? categoriesSuccess,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Initial value) initial,
    required TResult Function(_CategoriesLoading value) categoriesLoading,
    required TResult Function(_CategoriesError value) categoriesError,
    required TResult Function(_CategoriesSuccess value) categoriesSuccess,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Initial value)? initial,
    TResult? Function(_CategoriesLoading value)? categoriesLoading,
    TResult? Function(_CategoriesError value)? categoriesError,
    TResult? Function(_CategoriesSuccess value)? categoriesSuccess,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Initial value)? initial,
    TResult Function(_CategoriesLoading value)? categoriesLoading,
    TResult Function(_CategoriesError value)? categoriesError,
    TResult Function(_CategoriesSuccess value)? categoriesSuccess,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChallengesCommonStateCopyWith<$Res> {
  factory $ChallengesCommonStateCopyWith(ChallengesCommonState value,
          $Res Function(ChallengesCommonState) then) =
      _$ChallengesCommonStateCopyWithImpl<$Res, ChallengesCommonState>;
}

/// @nodoc
class _$ChallengesCommonStateCopyWithImpl<$Res,
        $Val extends ChallengesCommonState>
    implements $ChallengesCommonStateCopyWith<$Res> {
  _$ChallengesCommonStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$_InitialCopyWith<$Res> {
  factory _$$_InitialCopyWith(
          _$_Initial value, $Res Function(_$_Initial) then) =
      __$$_InitialCopyWithImpl<$Res>;
}

/// @nodoc
class __$$_InitialCopyWithImpl<$Res>
    extends _$ChallengesCommonStateCopyWithImpl<$Res, _$_Initial>
    implements _$$_InitialCopyWith<$Res> {
  __$$_InitialCopyWithImpl(_$_Initial _value, $Res Function(_$_Initial) _then)
      : super(_value, _then);
}

/// @nodoc

class _$_Initial implements _Initial {
  const _$_Initial();

  @override
  String toString() {
    return 'ChallengesCommonState.initial()';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$_Initial);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() categoriesLoading,
    required TResult Function(String errorMessage) categoriesError,
    required TResult Function(List<ChallengeCategory> categories)
        categoriesSuccess,
  }) {
    return initial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? categoriesLoading,
    TResult? Function(String errorMessage)? categoriesError,
    TResult? Function(List<ChallengeCategory> categories)? categoriesSuccess,
  }) {
    return initial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? categoriesLoading,
    TResult Function(String errorMessage)? categoriesError,
    TResult Function(List<ChallengeCategory> categories)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Initial value) initial,
    required TResult Function(_CategoriesLoading value) categoriesLoading,
    required TResult Function(_CategoriesError value) categoriesError,
    required TResult Function(_CategoriesSuccess value) categoriesSuccess,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Initial value)? initial,
    TResult? Function(_CategoriesLoading value)? categoriesLoading,
    TResult? Function(_CategoriesError value)? categoriesError,
    TResult? Function(_CategoriesSuccess value)? categoriesSuccess,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Initial value)? initial,
    TResult Function(_CategoriesLoading value)? categoriesLoading,
    TResult Function(_CategoriesError value)? categoriesError,
    TResult Function(_CategoriesSuccess value)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class _Initial implements ChallengesCommonState {
  const factory _Initial() = _$_Initial;
}

/// @nodoc
abstract class _$$_CategoriesLoadingCopyWith<$Res> {
  factory _$$_CategoriesLoadingCopyWith(_$_CategoriesLoading value,
          $Res Function(_$_CategoriesLoading) then) =
      __$$_CategoriesLoadingCopyWithImpl<$Res>;
}

/// @nodoc
class __$$_CategoriesLoadingCopyWithImpl<$Res>
    extends _$ChallengesCommonStateCopyWithImpl<$Res, _$_CategoriesLoading>
    implements _$$_CategoriesLoadingCopyWith<$Res> {
  __$$_CategoriesLoadingCopyWithImpl(
      _$_CategoriesLoading _value, $Res Function(_$_CategoriesLoading) _then)
      : super(_value, _then);
}

/// @nodoc

class _$_CategoriesLoading implements _CategoriesLoading {
  const _$_CategoriesLoading();

  @override
  String toString() {
    return 'ChallengesCommonState.categoriesLoading()';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$_CategoriesLoading);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() categoriesLoading,
    required TResult Function(String errorMessage) categoriesError,
    required TResult Function(List<ChallengeCategory> categories)
        categoriesSuccess,
  }) {
    return categoriesLoading();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? categoriesLoading,
    TResult? Function(String errorMessage)? categoriesError,
    TResult? Function(List<ChallengeCategory> categories)? categoriesSuccess,
  }) {
    return categoriesLoading?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? categoriesLoading,
    TResult Function(String errorMessage)? categoriesError,
    TResult Function(List<ChallengeCategory> categories)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (categoriesLoading != null) {
      return categoriesLoading();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Initial value) initial,
    required TResult Function(_CategoriesLoading value) categoriesLoading,
    required TResult Function(_CategoriesError value) categoriesError,
    required TResult Function(_CategoriesSuccess value) categoriesSuccess,
  }) {
    return categoriesLoading(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Initial value)? initial,
    TResult? Function(_CategoriesLoading value)? categoriesLoading,
    TResult? Function(_CategoriesError value)? categoriesError,
    TResult? Function(_CategoriesSuccess value)? categoriesSuccess,
  }) {
    return categoriesLoading?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Initial value)? initial,
    TResult Function(_CategoriesLoading value)? categoriesLoading,
    TResult Function(_CategoriesError value)? categoriesError,
    TResult Function(_CategoriesSuccess value)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (categoriesLoading != null) {
      return categoriesLoading(this);
    }
    return orElse();
  }
}

abstract class _CategoriesLoading implements ChallengesCommonState {
  const factory _CategoriesLoading() = _$_CategoriesLoading;
}

/// @nodoc
abstract class _$$_CategoriesErrorCopyWith<$Res> {
  factory _$$_CategoriesErrorCopyWith(
          _$_CategoriesError value, $Res Function(_$_CategoriesError) then) =
      __$$_CategoriesErrorCopyWithImpl<$Res>;
  @useResult
  $Res call({String errorMessage});
}

/// @nodoc
class __$$_CategoriesErrorCopyWithImpl<$Res>
    extends _$ChallengesCommonStateCopyWithImpl<$Res, _$_CategoriesError>
    implements _$$_CategoriesErrorCopyWith<$Res> {
  __$$_CategoriesErrorCopyWithImpl(
      _$_CategoriesError _value, $Res Function(_$_CategoriesError) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? errorMessage = null,
  }) {
    return _then(_$_CategoriesError(
      null == errorMessage
          ? _value.errorMessage
          : errorMessage // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$_CategoriesError implements _CategoriesError {
  const _$_CategoriesError(this.errorMessage);

  @override
  final String errorMessage;

  @override
  String toString() {
    return 'ChallengesCommonState.categoriesError(errorMessage: $errorMessage)';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$_CategoriesError &&
            (identical(other.errorMessage, errorMessage) ||
                other.errorMessage == errorMessage));
  }

  @override
  int get hashCode => Object.hash(runtimeType, errorMessage);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$_CategoriesErrorCopyWith<_$_CategoriesError> get copyWith =>
      __$$_CategoriesErrorCopyWithImpl<_$_CategoriesError>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() categoriesLoading,
    required TResult Function(String errorMessage) categoriesError,
    required TResult Function(List<ChallengeCategory> categories)
        categoriesSuccess,
  }) {
    return categoriesError(errorMessage);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? categoriesLoading,
    TResult? Function(String errorMessage)? categoriesError,
    TResult? Function(List<ChallengeCategory> categories)? categoriesSuccess,
  }) {
    return categoriesError?.call(errorMessage);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? categoriesLoading,
    TResult Function(String errorMessage)? categoriesError,
    TResult Function(List<ChallengeCategory> categories)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (categoriesError != null) {
      return categoriesError(errorMessage);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Initial value) initial,
    required TResult Function(_CategoriesLoading value) categoriesLoading,
    required TResult Function(_CategoriesError value) categoriesError,
    required TResult Function(_CategoriesSuccess value) categoriesSuccess,
  }) {
    return categoriesError(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Initial value)? initial,
    TResult? Function(_CategoriesLoading value)? categoriesLoading,
    TResult? Function(_CategoriesError value)? categoriesError,
    TResult? Function(_CategoriesSuccess value)? categoriesSuccess,
  }) {
    return categoriesError?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Initial value)? initial,
    TResult Function(_CategoriesLoading value)? categoriesLoading,
    TResult Function(_CategoriesError value)? categoriesError,
    TResult Function(_CategoriesSuccess value)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (categoriesError != null) {
      return categoriesError(this);
    }
    return orElse();
  }
}

abstract class _CategoriesError implements ChallengesCommonState {
  const factory _CategoriesError(final String errorMessage) =
      _$_CategoriesError;

  String get errorMessage;
  @JsonKey(ignore: true)
  _$$_CategoriesErrorCopyWith<_$_CategoriesError> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$_CategoriesSuccessCopyWith<$Res> {
  factory _$$_CategoriesSuccessCopyWith(_$_CategoriesSuccess value,
          $Res Function(_$_CategoriesSuccess) then) =
      __$$_CategoriesSuccessCopyWithImpl<$Res>;
  @useResult
  $Res call({List<ChallengeCategory> categories});
}

/// @nodoc
class __$$_CategoriesSuccessCopyWithImpl<$Res>
    extends _$ChallengesCommonStateCopyWithImpl<$Res, _$_CategoriesSuccess>
    implements _$$_CategoriesSuccessCopyWith<$Res> {
  __$$_CategoriesSuccessCopyWithImpl(
      _$_CategoriesSuccess _value, $Res Function(_$_CategoriesSuccess) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? categories = null,
  }) {
    return _then(_$_CategoriesSuccess(
      null == categories
          ? _value._categories
          : categories // ignore: cast_nullable_to_non_nullable
              as List<ChallengeCategory>,
    ));
  }
}

/// @nodoc

class _$_CategoriesSuccess implements _CategoriesSuccess {
  const _$_CategoriesSuccess(final List<ChallengeCategory> categories)
      : _categories = categories;

  final List<ChallengeCategory> _categories;
  @override
  List<ChallengeCategory> get categories {
    if (_categories is EqualUnmodifiableListView) return _categories;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_categories);
  }

  @override
  String toString() {
    return 'ChallengesCommonState.categoriesSuccess(categories: $categories)';
  }

  @override
  bool operator ==(dynamic other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$_CategoriesSuccess &&
            const DeepCollectionEquality()
                .equals(other._categories, _categories));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, const DeepCollectionEquality().hash(_categories));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$_CategoriesSuccessCopyWith<_$_CategoriesSuccess> get copyWith =>
      __$$_CategoriesSuccessCopyWithImpl<_$_CategoriesSuccess>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() categoriesLoading,
    required TResult Function(String errorMessage) categoriesError,
    required TResult Function(List<ChallengeCategory> categories)
        categoriesSuccess,
  }) {
    return categoriesSuccess(categories);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? categoriesLoading,
    TResult? Function(String errorMessage)? categoriesError,
    TResult? Function(List<ChallengeCategory> categories)? categoriesSuccess,
  }) {
    return categoriesSuccess?.call(categories);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? categoriesLoading,
    TResult Function(String errorMessage)? categoriesError,
    TResult Function(List<ChallengeCategory> categories)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (categoriesSuccess != null) {
      return categoriesSuccess(categories);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(_Initial value) initial,
    required TResult Function(_CategoriesLoading value) categoriesLoading,
    required TResult Function(_CategoriesError value) categoriesError,
    required TResult Function(_CategoriesSuccess value) categoriesSuccess,
  }) {
    return categoriesSuccess(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(_Initial value)? initial,
    TResult? Function(_CategoriesLoading value)? categoriesLoading,
    TResult? Function(_CategoriesError value)? categoriesError,
    TResult? Function(_CategoriesSuccess value)? categoriesSuccess,
  }) {
    return categoriesSuccess?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(_Initial value)? initial,
    TResult Function(_CategoriesLoading value)? categoriesLoading,
    TResult Function(_CategoriesError value)? categoriesError,
    TResult Function(_CategoriesSuccess value)? categoriesSuccess,
    required TResult orElse(),
  }) {
    if (categoriesSuccess != null) {
      return categoriesSuccess(this);
    }
    return orElse();
  }
}

abstract class _CategoriesSuccess implements ChallengesCommonState {
  const factory _CategoriesSuccess(final List<ChallengeCategory> categories) =
      _$_CategoriesSuccess;

  List<ChallengeCategory> get categories;
  @JsonKey(ignore: true)
  _$$_CategoriesSuccessCopyWith<_$_CategoriesSuccess> get copyWith =>
      throw _privateConstructorUsedError;
}
