import { InviteState } from '@verdzie/server/generated-graphql';
import { InviteListTransporter } from '@verdzie/server/invite-lists/invite-list.transporter';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

describe(InviteListTransporter.name, () => {
  let transporter: InviteListTransporter;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [InviteListTransporter],
    });
    transporter = module.get(InviteListTransporter);
  });

  describe(InviteListTransporter.prototype.toGqlInviteEdge.name, () => {
    it('should return an InviteEdge', () => {
      const user = UserEntityFake();
      transporter['userService'].toUserObject = jest
        .fn()
        .mockImplementation(params => params.user);
      const result = transporter.toGqlInviteEdge({ user });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        __typename: 'InviteEdge',
        cursor: user.id,
        node: {
          state: InviteState.JOINED_PENDING_VERIFICATION,
          user,
        },
      });
      expect(transporter['userService'].toUserObject).toHaveBeenCalledWith({
        user,
      });
    });
  });
});
