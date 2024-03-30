export type Tweet = {
  tweetId: string;
  text: string;
  userId: string;
  username: string;
  name: string;
  profile_image_url: string;
  verified_type: 'blue' | 'none';
};

export type TrollServerTweetsPayload = {
  [tweetId: string]: string;
};

export type TrollServerTweetsResponse = {
  [tweetId: string]: TrollServerTweetMetrics;
};

export type TrollServerTweetMetrics = {
  tox: number;
  obs: number;
  ins: number;
  idn: number;
  size: number;
  totals: {
    toxTotalScore: number;
    obsTotalScore: number;
    insTotalScore: number;
    idnTotalScore: number;
  };
  ratios: {
    toxRatio: number;
    obsRatio: number;
    insRatio: number;
    idnRatio: number;
  };
};

export type ToxicTwitterUser = {
  name: string;
  username: string;
  profile_image_url: string;
  tox: number;
};

export type ToxicityResults = {
  metrics?: TrollServerTweetMetrics;
  most_toxic_following?: ToxicTwitterUser[];
  error?: string;
};
