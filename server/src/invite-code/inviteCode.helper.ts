import { InviteCodeAction as GqlInviteCodeAction } from '@verdzie/server/generated-graphql';

export enum InviteCodeAction {
  ADD_TO_INNER_LIST = 1,
  ADD_TO_FOLLOWING_LIST = 2,
  SHARE_CHALLENGE = 3,
}

export const fromGqlInviteCodeAction = (
  value: GqlInviteCodeAction
): InviteCodeAction => {
  switch (value) {
    case GqlInviteCodeAction.ADD_TO_INNER_LIST:
      return InviteCodeAction.ADD_TO_INNER_LIST;
    case GqlInviteCodeAction.ADD_TO_FOLLOWING_LIST:
      return InviteCodeAction.ADD_TO_FOLLOWING_LIST;
    case GqlInviteCodeAction.SHARE_CHALLENGE:
      return InviteCodeAction.SHARE_CHALLENGE;
  }
};
