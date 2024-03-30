import 'package:equatable/equatable.dart';

enum AwardStatus {
  pending,
  completed,
  failed,
}

enum AwardType {
  inviteAccepted,
  // More to come
}

class CoinAward extends Equatable {
  const CoinAward({
    required this.id,
    required this.donorName,
    required this.dateReceived,
    required this.amount,
    required this.status,
    required this.type,
  });

  final String id;
  final String donorName;
  final DateTime dateReceived;
  final int amount;
  final AwardStatus status;
  final AwardType type;

  CoinAward copyWith({
    String? id,
    String? donorName,
    DateTime? dateReceived,
    int? amount,
    AwardStatus? status,
    AwardType? type,
  }) =>
      CoinAward(
        id: id ?? this.id,
        donorName: donorName ?? this.donorName,
        dateReceived: dateReceived ?? this.dateReceived,
        amount: amount ?? this.amount,
        status: status ?? this.status,
        type: type ?? this.type,
      );

  @override
  String toString() => 'CoinAward(id: $id, amount: $amount, status: $status)';

  @override
  List<Object?> get props => [id, amount, status];
}
