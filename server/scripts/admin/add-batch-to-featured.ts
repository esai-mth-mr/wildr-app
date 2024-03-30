import { addToFeatured } from './util/featured-challenges.util';

async function addFeaturedBatch() {
  try {
    const challengeIds = ['SchD-pUyp4VNZGwy'];

    for (const id of challengeIds) {
      await addToFeatured(id);
    }
  } catch (e) {
    console.log(e);
  }
}

addFeaturedBatch();
