import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntityType } from '../feed/feed.entity';
import { toFeedId } from '../feed/feed.service';
import { CommenterScope } from '../generated-graphql';
import { PostEntity } from '../post/post.entity';
import { PostEntityFake } from '../post/testing/post.fake';
import { postAccessControlFake } from '../post/testing/postAccessControl.fake';
import { createMockedTestingModule } from '../testing/base.module';
import { innerCircleListId } from '../user-list/userList.helpers';
import { UserEntityFake } from '../user/testing/user-entity.fake';
import { AccessControlService } from './access-control.service';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import {
  ForbiddenException,
  NotFoundException,
} from '@verdzie/server/exceptions/wildr.exception';
import { CommentEntityFake } from '@verdzie/server/comment/testing/comment-entity.fake';

describe('AccessControlService', () => {
  let service: AccessControlService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [AccessControlService],
    });
    service = module.get(AccessControlService);
  });

  describe('toGqlCommenterScopeValue', () => {
    it('should return NONE for -1', () => {
      expect(service.toGqlCommenterScopeValue(-1)).toEqual(CommenterScope.NONE);
    });

    it('should return FOLLOWING for 1', () => {
      expect(service.toGqlCommenterScopeValue(1)).toEqual(
        CommenterScope.FOLLOWING
      );
    });

    it('should return ALL for 0', () => {
      expect(service.toGqlCommenterScopeValue(0)).toEqual(CommenterScope.ALL);
    });
  });

  describe('getBackwardsCompatibleAccessControl', () => {
    it('should return the correct access control', () => {
      const post = new PostEntity();
      post.isPrivate = true;

      expect(service.getBackwardsCompatibleAccessControl(post)).toEqual({
        commentVisibilityAccessData: {
          access: 2,
        },
        postVisibilityAccessData: {
          access: 3,
        },
        commentPostingAccessData: {
          access: 2,
        },
        repostAccessData: {
          access: -1,
        },
      });
    });
  });

  describe('checkMessageVisibilityAccess', () => {
    it('should allow post author access regardless of access control', async () => {
      const currentUser = UserEntityFake();

      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentVisibilityAccessData.access = 5; // ListIds
      post.accessControl.commentVisibilityAccessData.listIds = [];
      post.authorId = currentUser.id;

      await service.checkMessageVisibilityAccess({
        object: post,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
      });
    });

    it('should not throw an error if the post comment access is everyone', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      // @ts-ignore
      post.accessControl.commentVisibilityAccessData.access = 2; // Everyone

      await service.checkMessageVisibilityAccess({
        object: post,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
      });
    });

    it('should throw if the comment access is follower and the user is not logged in', async () => {
      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentVisibilityAccessData.access = 3; // Followers

      await expect(
        service.checkMessageVisibilityAccess({
          object: post,
          currentUser: undefined,
          messageType: 'comment',
          parentType: 'post',
        })
      ).rejects.toThrowError('Login to view this comment');
    });

    it('should throw if the comment access is follower and user is not a follower', async () => {
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentVisibilityAccessData.access = 3; // Followers

      service['feedService'].findIndex = jest.fn().mockResolvedValue(-1);

      await expect(
        service.checkMessageVisibilityAccess({
          object: post,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        })
      ).rejects.toThrowError('');

      expect(service['feedService'].findIndex).toBeCalledWith(
        toFeedId(FeedEntityType.FOLLOWER, post.authorId),
        currentUser.id
      );
    });

    it('should throw if the post access is inner circle and user is not logged in', async () => {
      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentVisibilityAccessData.access = 4; // Inner Circle

      await expect(
        service.checkMessageVisibilityAccess({
          object: post,
          currentUser: undefined,
          messageType: 'comment',
          parentType: 'post',
        })
      ).rejects.toThrowError('Login to view this comment');
    });

    it('should throw if the post access is inner circle and user is not in the inner circle', async () => {
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentVisibilityAccessData.access = 4; // Inner Circle

      service['userListService'].findIndex = jest.fn().mockResolvedValue(-1);

      await expect(
        service.checkMessageVisibilityAccess({
          object: post,
          currentUser,
          messageType: 'reply',
          parentType: 'post',
        })
      ).rejects.toThrowError(
        `Only the author's inner circle can view replies on this post`
      );

      expect(service['userListService'].findIndex).toBeCalledWith(
        innerCircleListId(post.authorId),
        currentUser.id
      );
    });

    it('should throw if an invalid post access is provided', async () => {
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.accessControl = postAccessControlFake();
      // @ts-ignore
      post.accessControl.commentVisibilityAccessData.access = 6; // Nothing
      await expect(
        service.checkMessageVisibilityAccess({
          object: post,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        })
      ).rejects.toThrowError('Invalid access control');
    });
  });

  describe('checkMessageReactionAccess', () => {
    it('should allow post author access regardless of access control', async () => {
      const currentUser = UserEntityFake();

      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentPostingAccessData.access = 5; // ListIds
      post.accessControl.commentPostingAccessData.listIds = [];
      post.authorId = currentUser.id;

      await service.checkMessageReactionAccess({
        object: post,
        currentUser,
        messageType: 'reply',
        parentType: 'post',
      });
    });

    it('should not throw an error if the post comment access is everyone', async () => {
      const currentUser = UserEntityFake();
      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentPostingAccessData.access = 2; // Everyone

      await service.checkMessageReactionAccess({
        object: post,
        currentUser,
        messageType: 'reply',
        parentType: 'post',
      });
    });

    it('should throw if the comment access is follower and the user is not logged in', async () => {
      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentPostingAccessData.access = 3; // Followers

      await expect(
        service.checkMessageReactionAccess({
          object: post,
          currentUser: undefined,
          messageType: 'reply',
          parentType: 'post',
        })
      ).rejects.toThrowError('Login to react');
    });

    it('should throw if the comment access is follower and user is not a follower', async () => {
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentPostingAccessData.access = 3; // Followers

      service['feedService'].findIndex = jest.fn().mockResolvedValue(-1);

      await expect(
        service.checkMessageReactionAccess({
          object: post,
          currentUser,
          messageType: 'reply',
          parentType: 'post',
        })
      ).rejects.toThrowError('');

      expect(service['feedService'].findIndex).toBeCalledWith(
        toFeedId(FeedEntityType.FOLLOWER, post.authorId),
        currentUser.id
      );
    });

    it('should throw if the post access is inner circle and user is not logged in', async () => {
      const post = PostEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentPostingAccessData.access = 4; // Inner Circle

      await expect(
        service.checkMessageReactionAccess({
          object: post,
          currentUser: undefined,
          messageType: 'reply',
          parentType: 'post',
        })
      ).rejects.toThrowError('Login to react');
    });

    it('should throw if the post access is inner circle and user is not in the inner circle', async () => {
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.accessControl = postAccessControlFake();
      post.accessControl.commentPostingAccessData.access = 4; // Inner Circle

      service['userListService'].findIndex = jest.fn().mockResolvedValue(-1);

      await expect(
        service.checkMessageReactionAccess({
          object: post,
          currentUser,
          messageType: 'reply',
          parentType: 'post',
        })
      ).rejects.toThrowError(
        `Only the author's inner circle can react to replies on this post`
      );

      expect(service['userListService'].findIndex).toBeCalledWith(
        innerCircleListId(post.authorId),
        currentUser.id
      );
    });

    it('should throw if an invalid post access is provided', async () => {
      const post = PostEntityFake();
      const currentUser = UserEntityFake();
      post.accessControl = postAccessControlFake();
      // @ts-ignore
      post.accessControl.commentPostingAccessData.access = 6; // Nothing

      await expect(
        service.checkMessageReactionAccess({
          object: post,
          currentUser,
          messageType: 'reply',
          parentType: 'post',
        })
      ).rejects.toThrow();
    });
  });

  describe('checkMessagePostingAccess', () => {
    it('should require the use to be logged in', async () => {
      const parent = PostEntityFake();
      const result = await service.checkMessagePostingAccess({
        parent,
        currentUser: undefined,
        messageType: 'comment',
        parentType: 'post',
      });
      expect(result.isErr()).toBe(true);
    });

    it('should require that the user is not suspended', async () => {
      const parent = PostEntityFake();
      const currentUser = UserEntityFake();
      currentUser.isSuspended = true;
      const result = await service.checkMessagePostingAccess({
        parent,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
      });
      expect(result.isErr()).toBe(true);
    });

    it('should require that the user is not blocked from commenting on the post', async () => {
      const parent = PostEntityFake();
      const currentUser = UserEntityFake();
      parent.authorId = currentUser.id;
      service['feedService'].find = jest.fn().mockImplementation(async id => {
        if (
          id === toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_POST, parent.id)
        ) {
          const feed = FeedEntityFake();
          feed.page.ids = [currentUser.id];
          return feed;
        }
      });
      const result = await service.checkMessagePostingAccess({
        parent,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
      });
      expect(result.isErr()).toBe(true);
    });

    it('should require that the user is not blocked from commenting on the challenge', async () => {
      const parent = ChallengeEntityFake();
      const currentUser = UserEntityFake();
      parent.authorId = currentUser.id;
      service['feedService'].find = jest.fn().mockImplementation(async id => {
        if (
          id ===
          toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_CHALLENGE, parent.id)
        ) {
          const feed = FeedEntityFake();
          feed.page.ids = [currentUser.id];
          return feed;
        }
      });
      const result = await service.checkMessagePostingAccess({
        parent,
        currentUser,
        messageType: 'comment',
        parentType: 'challenge',
      });
      expect(result.isErr()).toBe(true);
    });

    it('should require that the user is not blocked by the parent author', async () => {
      const parent = PostEntityFake();
      const currentUser = UserEntityFake();
      service['feedService'].find = jest.fn().mockImplementation(async id => {
        if (
          id === toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_POST, parent.id)
        ) {
          const feed = FeedEntityFake();
          feed.page.ids = [];
          return feed;
        }
      });
      service['userService'].hasBlocked = jest.fn().mockResolvedValueOnce(true);
      const result = await service.checkMessagePostingAccess({
        parent,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
      });
      expect(result.isErr()).toBe(true);
      expect(service['userService'].hasBlocked).toBeCalledWith({
        userWhoBlockedId: parent.authorId,
        userIdToCheck: currentUser.id,
      });
    });

    describe('when comment posting access is nobody', () => {
      it('should not allow comments if comment posting access is none', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 0; // None
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isErr()).toBe(true);
      });
    });

    describe('when comment posting access is everyone', () => {
      it('should allow anyone to comment', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 2; // Everyone
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isOk()).toBe(true);
      });
    });

    describe('when comment posting access is follower access', () => {
      it('should allow comments by author', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.authorId = currentUser.id;
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 3; // Followers
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isOk()).toBe(true);
      });

      it('should not allow comments from non followers users', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 3; // Followers
        service['feedService'].findIndex = jest.fn().mockResolvedValue(-1);
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isErr()).toBe(true);
        expect(service['feedService'].findIndex).toBeCalledWith(
          toFeedId(FeedEntityType.FOLLOWER, parent.authorId),
          currentUser.id
        );
      });

      it('should not allow comments from followers users', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 3; // Followers
        service['feedService'].findIndex = jest.fn().mockResolvedValue(2);
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isErr()).toBe(false);
        expect(service['feedService'].findIndex).toBeCalledWith(
          toFeedId(FeedEntityType.FOLLOWER, parent.authorId),
          currentUser.id
        );
      });
    });

    describe('when comment posting access is inner circle', () => {
      it('should allow comments by author', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.authorId = currentUser.id;
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 4; // Inner circle
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isOk()).toBe(true);
      });

      it('should not allow comments from non inner circle users', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 4; // Inner circle
        service['userListService'].findIndex = jest.fn().mockResolvedValue(-1);
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isErr()).toBe(true);
        expect(service['userListService'].findIndex).toBeCalledWith(
          innerCircleListId(parent.authorId),
          currentUser.id
        );
      });

      it('should allow comments from inner circle users', async () => {
        const parent = PostEntityFake();
        const currentUser = UserEntityFake();
        parent.accessControl = postAccessControlFake();
        parent.accessControl.commentPostingAccessData.access = 4; // Inner circle
        service['userListService'].findIndex = jest.fn().mockResolvedValue(2);
        const result = await service.checkMessagePostingAccess({
          parent,
          currentUser,
          messageType: 'comment',
          parentType: 'post',
        });
        expect(result.isErr()).toBe(false);
        expect(service['userListService'].findIndex).toBeCalledWith(
          innerCircleListId(parent.authorId),
          currentUser.id
        );
      });
    });

    it('should catch unexpected errors', async () => {
      const parent = PostEntityFake();
      const currentUser = UserEntityFake();
      parent.accessControl = postAccessControlFake();
      parent.accessControl.commentPostingAccessData.access = 4; // Inner circle
      service['userListService'].findIndex = jest.fn().mockRejectedValue({});
      const result = await service.checkMessagePostingAccess({
        parent,
        currentUser,
        messageType: 'comment',
        parentType: 'post',
      });
      expect(result.isErr()).toBe(true);
    });
  });

  describe('checkReplyAccess', () => {
    it('should require users to be logged in', async () => {
      const result = await service.checkReplyAccess({
        currentUser: undefined,
        commentOrId: 'commentId',
      });
      expect(result.isErr()).toBe(true);
    });

    it('should return an error if the comment is not found', async () => {
      const currentUser = UserEntityFake();
      service['commentRepo'].findOne = jest.fn().mockResolvedValue(undefined);
      const result = await service.checkReplyAccess({
        currentUser,
        commentOrId: 'commentId',
      });
      expect(result.isErr()).toBe(true);
      expect(service['commentRepo'].findOne).toBeCalledWith('commentId');
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should forbid the user from replying if the comment author has blocked them', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      service['commentRepo'].findOne = jest.fn().mockResolvedValue(comment);
      service['userService'].hasBlocked = jest.fn().mockResolvedValue(true);
      const result = await service.checkReplyAccess({
        currentUser,
        commentOrId: 'commentId',
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ForbiddenException);
      }
    });

    it('should handle unexpected errors', async () => {
      const currentUser = UserEntityFake();
      const comment = CommentEntityFake();
      service['commentRepo'].findOne = jest.fn().mockResolvedValue(comment);
      service['userService'].hasBlocked = jest.fn().mockRejectedValue({});
      const result = await service.checkReplyAccess({
        currentUser,
        commentOrId: 'commentId',
      });
      expect(result.isErr()).toBe(true);
    });
  });
});
