import 'package:wildr_flutter/common/home_page_intent/home_page_intent.dart';
import 'package:wildr_flutter/constants/fdl_constants.dart';

class DLTestingConstants {
  static const kPostId = 'post_id';
  static const kReferrerHandle = 'ref_handle';
  static const kReferrerId = 'ref_id';
  static const Map<HomePageIntentType, String> intentTypeToDynamicLinkMap = {
    HomePageIntentType.POST: 'https://dev.wildr.com/share'
        '?o_id=$kPostId'
        '&s=${FDLParamValues.linkSourcePost}'
        '&r_handle=$kReferrerHandle'
        '&r_id=$kReferrerId',
  };
}
