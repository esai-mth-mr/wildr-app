import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/theme/text_style/wildr_text_styles.dart';
import 'package:wildr_flutter/common/widget/loading_container.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_coin/waitlist/data/coin_award.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/awards_bloc.dart';
import 'package:wildr_flutter/feat_coin/waitlist/presentation/widgets/transactions_component/award_list_item.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AwardsTabContent extends StatelessWidget {
  const AwardsTabContent({super.key});

  @override
  Widget build(BuildContext context) => BlocBuilder<AwardsBloc, AwardsState>(
        bloc: context.read<AwardsBloc>(),
        builder: (context, state) {
          if (state.loading) {
            return const _LoadingStateList();
          } else if (state.error != null) {
            return Center(
              child: Text(AppLocalizations.of(context)!.comm_errorOopsMessage),
            );
          }
          return state.isEmpty
              ? const _EmptyState()
              : _AwardsList(
                  awards: state.awards,
                );
        },
      );
}

class _LoadingStateList extends StatelessWidget {
  const _LoadingStateList();

  @override
  Widget build(BuildContext context) => ListView.separated(
        shrinkWrap: true,
        itemCount: 4,
        itemBuilder: (context, index) => LoadingContainer(height: 50.0.h),
        separatorBuilder: (context, index) => const SizedBox(height: 8),
      );
}

class _AwardsList extends StatelessWidget {
  const _AwardsList({
    required this.awards,
  });

  final List<CoinAward> awards;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: awards.length,
            itemBuilder: (context, index) => AwardListItem(
              coinAward: awards[index],
              onTap: () {
                log('${awards[index]} selected');
              },
            ),
            separatorBuilder: (context, index) => const Padding(
              padding: EdgeInsets.symmetric(vertical: 12.0),
              child: Divider(
                height: 1,
                color: WildrColors.gray100,
              ),
            ),
          ),
        ],
      );
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 24.0.h,
          ),
          WildrIcon(
            WildrIcons.inbox_outline,
            size: 40.0.sp,
            color: WildrColors.gray500,
          ),
          SizedBox(
            height: 14.0.h,
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 60.0.w),
            child: Text(
              AppLocalizations.of(context)!.wildrcoin_award_empty_state_text,
              textAlign: TextAlign.center,
              style: WildrTextStyles.p3Medium.copyWith(
                height: 1,
                color: WildrColors.gray700,
              ),
            ),
          ),
        ],
      );
}
