import 'dart:async';

import 'package:bloc/bloc.dart';

class InvitesBloc extends Bloc<InvitesEvent, InvitesState> {
  InvitesBloc() : super(const InvitesState(loading: false)) {
    on<FetchInvites>((event, emit) async {
      await _fetchInvites(emit);
    });
  }

  Future<void> _fetchInvites(Emitter<InvitesState> emit) async {
    emit(const InvitesState(loading: true));
    try {
      await Future.delayed(const Duration(seconds: 3));
      emit(
        // Returning a list of String items for debug reasons.
        // Needs to be replaced with instances of WildrUsers eventually.
        const InvitesState(
          loading: false,
          invites: [
            'a',
            'a',
            'a',
            'a',
            'a',
            'a',
          ],
        ),
      );
    } catch (e) {
      emit(InvitesState(loading: false, error: e.toString()));
    }
  }
}

// Events
abstract class InvitesEvent {}

class FetchInvites extends InvitesEvent {}

// State
class InvitesState {
  final bool loading;
  final List<String> invites;
  final String? error;

  const InvitesState({
    required this.loading,
    this.invites = const [],
    this.error,
  });

  bool get isEmpty => invites.isEmpty;
}
