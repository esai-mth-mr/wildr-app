import { InternalServerErrorException } from '@nestjs/common';
import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { isAppContext } from '@verdzie/server/common';

type ClassWithChallengeServiceOrChallengeCommentService = {
  challengeService: ChallengeService;
  challengeCommentService: ChallengeCommentService;
};

function addChallengeToResult(
  instance: ClassWithChallengeServiceOrChallengeCommentService,
  args: any[],
  result: any
) {
  for (const arg of args) {
    if (isAppContext(arg)) {
      if (!arg.challengeInteractionData.challenge) {
        result.challenge = null;
        return result;
      }
      if (instance.challengeCommentService) {
        result.challenge =
          instance.challengeCommentService.toGqlChallengeObject(
            arg.challengeInteractionData.challenge
          );
        return result;
      } else if (instance.challengeService) {
        result.challenge = instance.challengeService.toGqlChallengeObject(
          arg.challengeInteractionData.challenge
        );
        return result;
      } else {
        throw new InternalServerErrorException(
          `Class using ChallengeInteractionResult decorator must have ` +
            `challengeService or challengeCommentService.`
        );
      }
    }
  }
  throw new InternalServerErrorException(
    `Method using ChallengeInteractionResult decorator must accept the app ` +
      `context as an argument.`
  );
}

/**
 * Decorator for challenge interaction mutations that adds the challenge to the
 * result from the app context which is updated by the challenge interaction
 * service. The parent class of decorated methods must have a challengeService
 * property.
 */
export function ChallengeInteractionResult() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      if (originalMethod.constructor.name === 'AsyncFunction') {
        return originalMethod.apply(this, args).then((result: any) => {
          const instance =
            this as ClassWithChallengeServiceOrChallengeCommentService;
          return addChallengeToResult(instance, args, result);
        });
      } else {
        const result = originalMethod.apply(this, args);
        const instance =
          this as ClassWithChallengeServiceOrChallengeCommentService;
        return addChallengeToResult(instance, args, result);
      }
    };
    return descriptor;
  };
}
