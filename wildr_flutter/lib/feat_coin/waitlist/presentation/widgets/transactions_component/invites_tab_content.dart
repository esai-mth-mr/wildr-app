import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:wildr_flutter/common/theme/text_style/wildr_text_styles.dart';
import 'package:wildr_flutter/common/widget/loading_container.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_coin/waitlist/domain/invites_bloc.dart';
import 'package:wildr_flutter/gen/fonts.gen.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class InvitesTabContent extends StatelessWidget {
  const InvitesTabContent({super.key});

  @override
  Widget build(BuildContext context) => BlocBuilder<InvitesBloc, InvitesState>(
        bloc: context.read<InvitesBloc>(),
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
              : _InvitesList(
                  invites: state.invites,
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

class _InvitesList extends StatelessWidget {
  const _InvitesList({
    required this.invites,
  });

  final List<String> invites;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLocalizations.of(context)!.wildrcoin_invites_your_invites +
                ' (${invites.length})',
            style: const TextStyle(
              fontFamily: FontFamily.satoshi,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ).withColor(WildrColors.gray1200),
          ),
          SizedBox(height: 14.0.h),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: invites.length,
            itemBuilder: (context, index) => const _InviteListItem(
              username: 'Username',
            ),
            separatorBuilder: (context, index) => const SizedBox(height: 8),
          ),
        ],
      );
}

class _InviteListItem extends StatelessWidget {
  const _InviteListItem({
    required this.username,
  });

  final String username;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 50.0.h,
        child: Row(
          children: [
            Container(
              width: 50.0.h,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.greenAccent,
              ),
            ),
            SizedBox(width: 12.0.w),
            Text(
              username,
              style: WildrTextStyles.p2Medium.withColor(
                WildrColors.gray1200,
              ),
            ),
            const Spacer(),
            Container(
              height: 31.0.h,
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.all(Radius.circular(100.0)),
                color: WildrColors.gray100,
              ),
              child: Padding(
                padding:
                    EdgeInsets.symmetric(horizontal: 20.0.w, vertical: 5.0.w),
                child: Center(
                  child: Text(
                    AppLocalizations.of(context)!.wildrcoin_invites_joined,
                    style: WildrTextStyles.p3Medium.withColor(
                      WildrColors.gray700,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: 24.0.h),
          WildrIcon(
            WildrIcons.add_user_icon_filled,
            size: 40.0.sp,
            color: WildrColors.gray200,
          ),
          SizedBox(height: 14.0.h),
          Text(
            AppLocalizations.of(context)!.wildrcoin_invites_empty_state_text,
            textAlign: TextAlign.center,
            style: WildrTextStyles.p3Medium.copyWith(
              height: 1,
              color: WildrColors.gray700,
            ),
          ),
        ],
      );
}
