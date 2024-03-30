import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icon.dart';
import 'package:wildr_flutter/common/wildr_icons/wildr_icons.dart';
import 'package:wildr_flutter/feat_challenges/models/challenge.dart';
import 'package:wildr_flutter/feat_challenges/search/bloc/challenges_search_bloc.dart';
import 'package:wildr_flutter/feat_challenges/search/bloc/challenges_search_state.dart';
import 'package:wildr_flutter/feat_challenges/search/widgets/recent_search_list.dart';
import 'package:wildr_flutter/utils/app_sizer.dart';
import 'package:wildr_flutter/widgets/styling/wildr_colors.dart';

class SearchChallengesPage extends StatelessWidget {
  final List<String> recentSearch;
  final List<Challenge> featuredChallenges;
  final TextEditingController searchController;

  const SearchChallengesPage({
    super.key,
    required this.recentSearch,
    required this.featuredChallenges,
    required this.searchController,
  });

  Widget _seeMoreRow() => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'See More',
            style: TextStyle(
              color: WildrColors.gray500,
              fontSize: 14.0.sp,
              fontWeight: FontWeight.w400,
            ),
          ),
          SizedBox(
            width: 10.0.w,
          ),
          WildrIcon(
            WildrIcons.seeMoreDownArrow,
            size: 6.0.wh,
            color: WildrColors.gray500,
          ),
        ],
      );

  Widget _noChallengeFound() => Center(
        child: Text(
          'Didn’t find what you’re looking for?',
          style: TextStyle(
            fontSize: 14.0.sp,
            color: WildrColors.gray500,
            fontWeight: FontWeight.w500,
          ),
        ),
      );

  Widget _createChallengeText() => Center(
        child: Text(
          'Create your own Challenge!',
          style: TextStyle(
            fontSize: 14.0.sp,
            fontWeight: FontWeight.w500,
            decoration: TextDecoration.underline,
          ),
        ),
      );

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<ChallengeSearchBloc, ChallengeSearchState>(
        builder: (context, state) => CustomScrollView(
          slivers: [
            if (searchController.text.isEmpty) ...[
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
                sliver: SliverToBoxAdapter(
                  child: Text(
                    'Recent',
                    style: Theme.of(context).textTheme.displayLarge,
                  ),
                ),
              ),
              RecentSearchList(
                recentSearch: recentSearch,
              ),
              SliverToBoxAdapter(
                child: GestureDetector(
                  onTap: () {
                    // Handle "See More" tap
                  },
                  child: _seeMoreRow(),
                ),
              ),
              const _SliverFeaturedText(),
              SliverPadding(
                padding: EdgeInsets.only(top: 10.0.h),
                sliver: _SliverFeaturedList(challenge: featuredChallenges),
              ),
            ],
            if (state is NoChallengeFound) ...[
              SliverPadding(
                padding: EdgeInsets.only(top: 16.0.h, bottom: 5.0.h),
                sliver: SliverToBoxAdapter(
                  child: _noChallengeFound(),
                ),
              ),
              SliverPadding(
                padding: EdgeInsets.only(bottom: 16.0.h),
                sliver: SliverToBoxAdapter(
                  child: _createChallengeText(),
                ),
              ),
              const SliverToBoxAdapter(
                child: Center(
                  child: Divider(
                    color: WildrColors.gray1100,
                    thickness: 2,
                    height: 2,
                  ),
                ),
              ),
              const _SliverFeaturedText(),
              SliverPadding(
                padding: EdgeInsets.only(top: 10.0.h),
                sliver: _SliverFeaturedList(challenge: featuredChallenges),
              ),
            ],
            if (state is ChallengeSearchResult)
              _SliverFeaturedList(challenge: state.searchResult),
          ],
        ),
      );
}

class _SliverFeaturedText extends StatelessWidget {
  const _SliverFeaturedText();

  @override
  Widget build(BuildContext context) => SliverPadding(
        padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
        sliver: SliverToBoxAdapter(
          child: Text(
            'Featured Challenges',
            style: Theme.of(context).textTheme.displayLarge,
          ),
        ),
      );
}

class _SliverFeaturedList extends StatelessWidget {
  final List<Challenge> challenge;
  const _SliverFeaturedList({required this.challenge});

  @override
  Widget build(BuildContext context) => SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => Container(),
          childCount: challenge.length,
        ),
      );
}
