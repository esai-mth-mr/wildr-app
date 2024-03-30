import 'package:bloc/bloc.dart';
import 'package:wildr_flutter/bloc/theme/theme_event.dart';
import 'package:wildr_flutter/bloc/theme/theme_state.dart';
import 'package:wildr_flutter/widgets/styling/app_theme_data.dart';

class ThemeBloc extends Bloc<ThemeEvent, ThemeState> {

  ThemeBloc()
      : super(
          ThemeState(
            themeData: AppThemesData.themeData[AppThemeEnum.LightTheme]!,
          ),
        ) {
    on<ThemeEvent>(
      (event, emit) =>
          emit(ThemeState(themeData: AppThemesData.themeData[event.appTheme]!)),
    );
  }
}
