import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:get/get.dart';
import 'package:wildr_flutter/bloc/main/main_bloc.dart';
import 'package:wildr_flutter/feat_challenges/challenge_post/bloc/challenge_post_state.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/single_challenge/challenge_cover.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/actions/post_settings_gxc.dart';
import 'package:wildr_flutter/feat_create_post/post_settings/data/post_visibility_access.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/bottom_sheets/bottom_sheet_top_divider.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class AssignToChallengeBottomSheet extends StatelessWidget {
  final PostSettingsGxC gxc;

  const AssignToChallengeBottomSheet(this.gxc, {super.key});

  @override
  Widget build(BuildContext context) => BlocBuilder<MainBloc, MainState>(
        builder: (context, state) {
          if (state is! GetJoinedChallengesState) {
            return _buildBottomSheet(context, 0.2, 0.2);
          }
          final numChallenges = state.joinedChallenges?.length ?? 0;
          double initialChildSize = 0.5;
          double maxChildSize = 0.9;
          if (numChallenges > 5) {
            initialChildSize = 0.45;
            maxChildSize = 0.9;
          } else if (numChallenges > 0 && numChallenges <= 5) {
            initialChildSize = 0.45;
            maxChildSize = 0.6;
          }
          return _buildBottomSheet(context, initialChildSize, maxChildSize);
        },
      );

  Widget _buildBottomSheet(
    BuildContext context,
    double initialChildSize,
    double maxChildSize,
  ) =>
      DraggableScrollableSheet(
        initialChildSize:
            initialChildSize, // Adjust this value for your initial small size
        minChildSize: 0.1,
        maxChildSize: maxChildSize,
        builder: (
          context,
          scrollController,
        ) =>
            Obx(
          () => DecoratedBox(
            decoration: BoxDecoration(
              color: WildrColors.assignToChallengeBottomSheetColor(context),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(15),
                topRight: Radius.circular(15),
              ),
            ),
            child: Column(
              children: [
                const _AssignChallengeHeaderTitleWidget(),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scrollController,
                    padding: EdgeInsets.only(
                      left: 10,
                      right: 10,
                      bottom: MediaQuery.of(context).padding.bottom,
                    ),
                    child: _JoinedChallengesList(
                      selectedChallenge: gxc.selectedChallenge.value,
                      onSelectChallenge: (selectedChallenge) {
                        final previousRepostValue = gxc.repostAccess;
                        gxc.selectedChallenge.value = selectedChallenge;
                        gxc
                          ..selectedPostVisibilityAccess =
                              PostVisibilityAccess.EVERYONE
                          ..repostAccess = previousRepostValue;
                        Navigator.pop(context);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}

class _AssignChallengeHeaderTitleWidget extends StatelessWidget {
  const _AssignChallengeHeaderTitleWidget();

  @override
  Widget build(BuildContext context) => Column(
        children: [
          const BottomSheetTopDivider(widthFactor: 0.1),
          Text(
            AppLocalizations.of(context)!.challenge_linkToChallenge,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: WildrColors.appBarTextColor(),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            AppLocalizations.of(context)!.challenge_linkToChallengeSubTitle,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: WildrColors.createPostV2LabelsColor(),
            ),
          ),
        ],
      );
}

class _JoinedChallengesList extends StatelessWidget {
  final Challenge selectedChallenge;
  final Function(Challenge selectedChallenge) onSelectChallenge;

  const _JoinedChallengesList({
    required this.selectedChallenge,
    required this.onSelectChallenge,
  });

  Widget _coverImage(Challenge challenge) => ChallengeCoverCard(
        challenge: challenge,
        showDaysRemaining: false,
        roundedCorners: true,
      );

  Widget _loader() => const Padding(
        padding: EdgeInsets.all(20),
        child: Center(child: CircularProgressIndicator()),
      );

  Widget _noneListTile(BuildContext context) {
    final challenge = Challenge.empty();
    return ListTile(
      title: Text(
        AppLocalizations.of(context)!.comm_cap_none,
        style: TextStyle(color: WildrColors.appBarTextColor()),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      onTap: () => onSelectChallenge(challenge),
      trailing: Checkbox(
        value: selectedChallenge.id == challenge.id,
        onChanged: (value) => onSelectChallenge(challenge),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
        activeColor: WildrColors.emerald800,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  Widget _listTile(Challenge challenge) => ListTile(
        onTap: () => onSelectChallenge(challenge),
        leading: SizedBox(
          height: 43.0.h,
          width: 43.0.w,
          child: _coverImage(challenge),
        ),
        title: Text(
          challenge.name,
          style: TextStyle(color: WildrColors.appBarTextColor()),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          challenge.author.handle,
          style: const TextStyle(color: WildrColors.gray500),
        ),
        trailing: Checkbox(
          value: selectedChallenge.id == challenge.id,
          onChanged: (value) => onSelectChallenge(challenge),
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          visualDensity: VisualDensity.compact,
          activeColor: WildrColors.emerald800,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );

  Widget _listView(List<Challenge> joinedChallenges, BuildContext context) {
    final List<Widget> children = [];
    for (int index = 0; index < joinedChallenges.length; index++) {
      final challenge = joinedChallenges[index];
      children.add(_listTile(challenge));
      if (index != joinedChallenges.length - 1) {
        children.add(Divider(color: Colors.grey.withOpacity(0.5)));
      }
    }
    children
      ..add(Divider(color: Colors.grey.withOpacity(0.5)))
      ..add(_noneListTile(context));
    return Column(mainAxisSize: MainAxisSize.min, children: children);
  }

  Widget _builder(context, MainState state) {
    // this could should never be reached
    if (state is! GetJoinedChallengesState) return _loader();
    if (state.isLoading) {
      return _loader();
    } else if (state.errorMessage != null) {
      return Center(
        child: Text(
          state.errorMessage!,
          style: TextStyle(color: WildrColors.appBarTextColor()),
        ),
      );
    } else if (state.joinedChallenges != null &&
        state.joinedChallenges!.isNotEmpty) {
      return _listView(state.joinedChallenges!, context);
    } else {
      return Center(
        child: Text(AppLocalizations.of(context)!.challenge_noChallengesFound),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.only(top: 15.0.w),
        child: BlocBuilder<MainBloc, MainState>(
          builder: _builder,
          buildWhen: (previous, current) => current is GetJoinedChallengesState,
        ),
      );
}
