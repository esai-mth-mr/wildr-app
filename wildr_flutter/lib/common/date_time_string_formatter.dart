import 'package:timeago/timeago.dart' as timeago;

String getTimeAgo({required DateTime fromDate}) => timeago.format(
      fromDate,
      locale: 'en_short',
    );
