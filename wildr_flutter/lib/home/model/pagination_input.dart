import 'package:wildr_flutter/bloc/main/main_bloc.dart';

class PaginationInput {
  final int take;
  final String? after;
  final String? includingAndAfter;
  final String? before;
  final String? includingAndBefore;
  final PaginationOrder order;

  PaginationInput({
    this.take = DEFAULT_FIRST_COUNT,
    this.after,
    this.includingAndAfter,
    this.before,
    this.includingAndBefore,
    this.order = PaginationOrder.LATEST_FIRST,
  });

  Map<String, dynamic> getMap() => {
      'take': take,
      'after': after,
      'includingAndAfter': includingAndAfter,
      'before': before,
      'includingAndBefore': includingAndBefore,
      'order': order.name,
    };
}

enum PaginationOrder {
  DEFAULT,
  LATEST_FIRST,
  OLDEST_FIRST,
}
