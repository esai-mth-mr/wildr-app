import {
  ToxicityResults,
  ToxicTwitterUser,
  TrollServerTweetMetrics,
  TrollServerTweetsPayload,
  TrollServerTweetsResponse,
  Tweet,
} from '@/types/tweet';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import {
  TweetHomeTimelineV2Paginator,
  TweetV2,
  TwitterApi,
  UserV2,
} from 'twitter-api-v2';
import { logger as parentLogger } from '../../../logging';

const logger = parentLogger.child(
  { module: 'timeline' },
  { msgPrefix: '[timeline] ' }
);

const TWEET_LIMIT = process.env.TWEET_LIMIT ?? 500;
const REPLY_COUNT_THRESHOLD = process.env.REPLY_COUNT_THRESHOLD ?? 5;
const METRIC_THRESHOLD = process.env.METRIC_THRESHOLD ?? 0.4;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ToxicityResults>
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      logger.error('failed to get user auth token');
      res.status(401).json({ error: 'Failed to get token' });
      return;
    }

    let apiCalls = 0;
    const twitterClient = new TwitterApi(token.twitterAccessToken).readOnly;

    // "Cache" the tweet authors so we can access them faster for later.
    const idToTweetAuthor = new Map<string, UserV2>();

    const trollServerFutures: Promise<TrollServerTweetsResponse>[] = [];
    const allFilteredTweets: Tweet[] = [];

    let current: TweetHomeTimelineV2Paginator;
    const twitterLatencies = [];
    const start = performance.now();
    try {
      logger.debug(
        'starting to fetch tweets from timeline, limit: %d',
        TWEET_LIMIT
      );
      apiCalls += 1;
      current = await twitterClient.v2.homeTimeline({
        'tweet.fields': ['public_metrics', 'created_at'],
        'user.fields': ['name', 'verified_type', 'profile_image_url'],
        // exclude: ['retweets'],
        expansions: ['author_id'],
      });
    } catch (error) {
      logger.error(error, 'caught an error getting tweets');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    } finally {
      twitterLatencies.push(performance.now() - start);
    }

    while (!current.done && allFilteredTweets.length <= TWEET_LIMIT) {
      const filteredTweets = getFilteredTweets(
        current.tweets,
        current.includes.users,
        idToTweetAuthor
      );

      trollServerFutures.push(getTweetScores(filteredTweets));

      allFilteredTweets.push(...filteredTweets);

      if (allFilteredTweets.length <= TWEET_LIMIT) {
        apiCalls += 1;
        try {
          const start = performance.now();
          current = await current.next();
        } finally {
          twitterLatencies.push(performance.now() - start);
        }
      }
    }
    logger.debug(
      {
        size: allFilteredTweets.length,
        twitterLatencies,
      },
      'finished fetching tweets, attempts %d',
      apiCalls
    );

    const allTrollServerResponses = await Promise.all(trollServerFutures);

    const tweetIdToMetrics: TrollServerTweetsResponse = {};
    for (const tweetMetrics of allTrollServerResponses) {
      Object.assign(tweetIdToMetrics, tweetMetrics);
    }

    const scores = calculateToxicityScores(tweetIdToMetrics);
    logger.info(scores, 'finished computing scores');

    let mostToxicFollowing: ToxicTwitterUser[] = [];
    if (process.env.NEXT_PUBLIC_ENABLE_TOP_TOXIC_USERS === 'true') {
      const sortedUsernames = getMostToxicUsers(
        allFilteredTweets,
        tweetIdToMetrics
      );
      logger.info(sortedUsernames, 'creating response with top users');

      mostToxicFollowing = sortedUsernames.map(([userId, score]) => {
        const tweetAuthor = idToTweetAuthor.get(userId)!;

        return {
          username: tweetAuthor.username,
          name: tweetAuthor.name,
          profile_image_url: tweetAuthor.profile_image_url!.replace(
            '_normal',
            ''
          ),
          tox: score,
        };
      });
    }

    res.status(200).json({
      metrics: scores,
      most_toxic_following: mostToxicFollowing,
    });
  } catch (error) {
    logger.error(error, 'error while handling request');
    res.status(500).json({ error: 'Failed to get timeline' });
  }
}

function getFilteredTweets(
  tweets: TweetV2[],
  authors: UserV2[],
  idToAuthorData: Map<string, UserV2>
): Tweet[] {
  // Update the tweet authors cache.
  for (const authorData of authors) {
    idToAuthorData.set(authorData.id, authorData);
  }

  const filteredTweets: Tweet[] = [];
  for (const tweetData of tweets) {
    const tweetAuthorData = idToAuthorData.get(tweetData.author_id ?? '');

    if (
      tweetAuthorData &&
      (tweetAuthorData.verified_type === 'blue' ||
        tweetAuthorData.verified_type === 'none') &&
      (tweetData.public_metrics?.reply_count ?? 0) >= REPLY_COUNT_THRESHOLD
    ) {
      filteredTweets.push({
        tweetId: tweetData.id,
        text: tweetData.text,
        userId: tweetData.author_id!,
        username: tweetAuthorData.username,
        name: tweetAuthorData.name,
        profile_image_url: tweetAuthorData.profile_image_url!,
        verified_type: tweetAuthorData.verified_type,
      });
    }
  }
  logger.trace(
    'filtered tweets: filtered: %d, total: %d',
    filteredTweets.length,
    tweets.length
  );

  return filteredTweets;
}

async function getTweetScores(
  tweets: Tweet[]
): Promise<TrollServerTweetsResponse> {
  logger.trace('sending tweets to troll server, size: %d', tweets.length);

  const payload: TrollServerTweetsPayload = {};
  for (const tweet of tweets) payload[tweet.tweetId] = tweet.text;

  if (Object.keys(payload).length === 0) {
    logger.warn('no tweets to send to troll server');
    return {};
  }

  const start = performance.now();
  try {
    const response = await fetch(
      `http://${process.env.TROLL_SERVER_URL}/sentiment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      logger.error(response, 'failed to get metrics from troll server');
      throw new Error('Failed to get troll server response');
    }
    logger.trace('metrics received from troll server');

    return response.json();
  } finally {
    const end = performance.now() - start;
  }
}

function calculateToxicityScores(
  metrics: TrollServerTweetsResponse
): TrollServerTweetMetrics {
  const totals = {
    toxTotalScore: 0,
    obsTotalScore: 0,
    insTotalScore: 0,
    idnTotalScore: 0,
  };

  const metricValues = Object.values(metrics);

  for (const metric of metricValues) {
    if (metric.tox >= METRIC_THRESHOLD) totals.toxTotalScore += 2;
    if (metric.obs >= METRIC_THRESHOLD) totals.obsTotalScore += 2;
    if (metric.ins >= METRIC_THRESHOLD) totals.insTotalScore += 2;
    if (metric.idn >= METRIC_THRESHOLD) totals.idnTotalScore += 2;
  }

  const ratios = {
    toxRatio: (totals.toxTotalScore / metricValues.length) * 10,
    obsRatio: (totals.obsTotalScore / metricValues.length) * 10,
    insRatio: (totals.insTotalScore / metricValues.length) * 10,
    idnRatio: (totals.idnTotalScore / metricValues.length) * 10,
  };

  const calculateScore = (ratio: number) => {
    const res = 3 * Math.log(4.2 * ratio + 0.4) + 2;
    return res < 0 ? 0 : res;
  };

  const scores = {
    tox: (calculateScore(ratios.toxRatio) * 0.8) / 10,
    obs: (calculateScore(ratios.obsRatio) * 0.8) / 10,
    ins: (calculateScore(ratios.insRatio) * 1.85) / 10,
    idn: (calculateScore(ratios.idnRatio) * 1.85) / 10,
    size: metricValues.length,
    totals: totals,
    ratios: ratios,
  };
  return scores;
}

function getMostToxicUsers(
  allTweets: Tweet[],
  allTweetMetrics: TrollServerTweetsResponse
): [string, number][] {
  logger.info('started sorting users by toxicity...');

  const userIdToTweetMetrics = new Map<string, TrollServerTweetsResponse>();
  const userIdToToxicityValueTotals = new Map<string, number>();

  // Group tweets by user
  for (const tweet of allTweets) {
    const userTweetMetrics = userIdToTweetMetrics.get(tweet.userId) || {};
    userTweetMetrics[tweet.tweetId] = allTweetMetrics[tweet.tweetId];
    userIdToTweetMetrics.set(tweet.userId, userTweetMetrics);
  }

  // Calculate scores
  for (const entry of userIdToTweetMetrics) {
    const score = calculateToxicityScores(entry[1]);
    const userToxTotal = Math.max(score.tox, score.idn, score.ins, score.obs);
    //(Object.values(score.totals).reduce((a, b) => a + b, 0) * 1.0);
    userIdToToxicityValueTotals.set(entry[0], userToxTotal);
  }
  logger.debug(
    userIdToToxicityValueTotals,
    'finished sorting users by toxicity'
  );

  const result = [...userIdToToxicityValueTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  result.forEach(([userId, _1], _2) =>
    logger.debug(
      { userId, metrics: userIdToTweetMetrics.get(userId) },
      'top 3 toxic user scores'
    )
  );
  logger.debug(result, 'returning top 3 toxic authors');

  return result;
}
