import { removeFromFeatured } from './util/featured-challenges.util';

async function removeFeaturedBatch() {
  try {
    const challengeIds = [
      'l51oAz0m2MyRSFdq',
      'UXU_jDQXRwqkgzM4',
      'ET0-6TUxuHv8bjUg',
      'Cq-SOOmmBSgqBkfH',
    ];

    for (const id of challengeIds) {
      await removeFromFeatured(id);
    }
  } catch (e) {
    console.log(e);
  }
}

removeFeaturedBatch();
