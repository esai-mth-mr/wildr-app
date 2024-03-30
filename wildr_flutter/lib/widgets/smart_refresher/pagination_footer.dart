import 'package:flutter/cupertino.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';

Widget createEmptyPaginationFooter({double? additionalHeight}) => ClassicFooter(
      height: (additionalHeight ?? 0) + 60,
      loadingText: 'Loading...',
      loadStyle: LoadStyle.ShowWhenLoading,
      noDataText: '',
    );
