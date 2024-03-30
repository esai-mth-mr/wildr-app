import { signup } from '../signup';
import { createChallenge } from './create-challenge';
import { joinChallenge } from './join-challenge';
import { createPost } from '../post/create-post';
import { deletePost } from '../post/delete-post';

async function main() {
  const { user, jwtToken } = await signup();
  console.log(user);
  console.log(jwtToken);
  const { id } = await createChallenge({ jwt: jwtToken });
  const { jwtToken: jwtToken2 } = await signup();
  await joinChallenge({ jwt: jwtToken2, challengeId: id });
  const post = await createPost({ jwt: jwtToken2, challengeId: id });
  await createPost({ jwt: jwtToken2, challengeId: id });
  await deletePost({ jwt: jwtToken2, postId: post.id });
}

main();
