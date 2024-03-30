import { OnboardingType } from '../../../src/generated-graphql';
import { client } from '../server-client';
import { signup } from '../signup';

async function skipOnboarding({
  jwtToken,
  onboardingType,
}: {
  jwtToken: string;
  onboardingType: OnboardingType;
}) {
  try {
    const response = await client.post(
      '/graphql',
      {
        query: /* GraphQL */ `
          mutation skipOnboarding(
            $skipOnboardingInput: UpdateOnboardingInput!
          ) {
            skipOnboarding(input: $skipOnboardingInput) {
              ... on OnboardingStats {
                innerCircle
                challenges
                commentReplyLikes
                challengeAuthorInteractions
              }
            }
          }
        `,
        variables: {
          skipOnboardingInput: {
            type: onboardingType,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    if (response) {
      console.log('skipped onboarding');
    }
    return response;
  } catch (err) {
    console.log('error skipping onboarding');
    // @ts-ignore
    console.log(err.response.data);
  }
}

async function finishOnboarding({
  jwtToken,
  onboardingType,
}: {
  jwtToken: string;
  onboardingType: OnboardingType;
}) {
  try {
    const response = await client.post(
      '/graphql',
      {
        query: /* GraphQL */ `
          mutation finishOnboarding(
            $finishOnboardingInput: UpdateOnboardingInput!
          ) {
            finishOnboarding(input: $finishOnboardingInput) {
              ... on OnboardingStats {
                innerCircle
                challenges
                commentReplyLikes
                challengeAuthorInteractions
              }
            }
          }
        `,
        variables: {
          finishOnboardingInput: {
            type: onboardingType,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    if (response) {
      console.log('finished onboarding');
    }
    return response;
  } catch (err) {
    console.log('error finishing onboarding');
    // @ts-ignore
    console.log(err.response);
  }
}

async function skipOnboardingTest() {
  console.log('\nSKIP ONBOARDING TEST');
  const { jwtToken } = await signup();
  const response = await skipOnboarding({
    jwtToken,
    onboardingType: OnboardingType.CHALLENGES,
  });
  // @ts-ignore
  console.log(JSON.stringify(response?.data.data.skipOnboarding, null, 2));
}

async function finishOnboardingTest() {
  console.log('\nFINISH ONBOARDING TEST');
  const { jwtToken } = await signup();
  const response = await finishOnboarding({
    jwtToken,
    onboardingType: OnboardingType.CHALLENGE_AUTHOR_INTERACTIONS,
  });
  // @ts-ignore
  console.log(JSON.stringify(response?.data.data.finishOnboarding, null, 2));
}

async function main() {
  await skipOnboardingTest();
  await finishOnboardingTest();
}

main();
