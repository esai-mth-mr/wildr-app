import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenException,
  ForbiddenExceptionCodes,
  InternalServerErrorException,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  CommentPostingAccess,
  CommentPostingAccessData,
  CommentVisibilityAccess,
  CommentVisibilityAccessData,
  PostAccessControl,
  backwardCompatiblePostAccessControl,
} from '@verdzie/server/post/postAccessControl';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  PostVisibility,
  CommenterScope,
} from '@verdzie/server/generated-graphql';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { WildrExceptionDecorator } from '../common/wildr-exception.decorator';
import { defaultChallengeAccessControl } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl';
import { Result, err, ok } from 'neverthrow';
import { UserService } from '@verdzie/server/user/user.service';
import { CommentRepository } from '@verdzie/server/comment/comment.repository';
import { kSomethingWentWrong } from '@verdzie/server/common';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';

export type MessageEntity = CommentEntity | ReplyEntity;
export type MessageType = 'comment' | 'reply';
export type MessageParentType = 'post' | 'challenge';

export interface ObjectWithCommentAccessControl {
  id: string;
  authorId: string;
  accessControl?: {
    commentVisibilityAccessData: CommentVisibilityAccessData;
    commentPostingAccessData: CommentPostingAccessData;
  };
}

function pluralize(messageType?: MessageType) {
  switch (messageType) {
    case 'comment':
      return 'comments';
    case 'reply':
      return 'replies';
    default:
      return 'messages';
  }
}

@Injectable()
export class AccessControlService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private userListService: UserListService,
    private userService: UserService,
    private feedService: FeedService,
    private commentRepo: CommentRepository
  ) {
    this.logger = logger.child({ service: 'AccessControlService' });
  }

  toGqlCommenterScopeValue(value: number): CommenterScope {
    switch (value) {
      case -1:
        return CommenterScope.NONE;
      case 1:
        return CommenterScope.FOLLOWING;
      default:
        return CommenterScope.ALL;
    }
  }

  getBackwardsCompatibleAccessControl(post: PostEntity): PostAccessControl {
    return backwardCompatiblePostAccessControl(
      post.isPrivate ? PostVisibility.FOLLOWERS : PostVisibility.ALL,
      this.toGqlCommenterScopeValue(post.commentScopeType)
    );
  }

  // TODO use neverthrow
  // TODO handle single message block relation between author and viewer
  @WildrExceptionDecorator()
  async checkMessageVisibilityAccess({
    object,
    currentUser,
    messageType,
    parentType,
    message,
  }: {
    object: ObjectWithCommentAccessControl;
    currentUser?: UserEntity;
    messageType: MessageType;
    parentType: MessageParentType;
    message?: MessageEntity;
  }) {
    if (object.authorId === currentUser?.id) return;
    if (!object.accessControl) {
      if (object instanceof PostEntity) {
        object.accessControl = this.getBackwardsCompatibleAccessControl(object);
      } else {
        object.accessControl = defaultChallengeAccessControl();
      }
    }
    switch (object.accessControl.commentVisibilityAccessData.access) {
      case CommentVisibilityAccess.EVERYONE:
        return;
      case CommentVisibilityAccess.FOLLOWERS:
        if (!currentUser)
          throw new ForbiddenException(`Login to view this ${messageType}`, {
            exceptionCode: ForbiddenExceptionCodes.LOGIN_REQUIRED,
          });
        const followerIndex = await this.feedService.findIndex(
          toFeedId(FeedEntityType.FOLLOWER, object.authorId),
          currentUser.id
        );
        if (followerIndex === -1)
          throw new ForbiddenException(
            `Only the author's followers can view ${pluralize(
              messageType
            )} on this ${parentType}`,
            {
              exceptionCode: ForbiddenExceptionCodes.FOLLOWING_REQUIRED,
            }
          );
        return;
      case CommentVisibilityAccess.INNER_CIRCLE:
        if (!currentUser)
          throw new ForbiddenException(`Login to view this ${messageType}`);
        const innerCircleIndex = await this.userListService.findIndex(
          innerCircleListId(object.authorId),
          currentUser.id
        );
        if (innerCircleIndex === -1)
          throw new ForbiddenException(
            `Only the author's inner circle can view ${pluralize(
              messageType
            )} on this ${parentType}`,
            {
              exceptionCode: ForbiddenExceptionCodes.INNER_CIRCLE_REQUIRED,
            }
          );
        return;
      case CommentVisibilityAccess.AUTHOR:
        if (!currentUser)
          throw new ForbiddenException(`Login to view this ${messageType}`);
        if (object.authorId === currentUser.id) return;
        // Allow message author to view their own comment's replies or their
        // own comments
        if (message?.authorId === currentUser.id) return;
        throw new ForbiddenException(
          `Only the author can view ${pluralize(
            messageType
          )} on this ${parentType}`,
          {
            exceptionCode: ForbiddenExceptionCodes.AUTHOR_REQUIRED,
          }
        );
      default:
        throw new InternalServerErrorException(
          `[checkVisibilityAccessForComment] Invalid access control`,
          {
            postId: object.id,
            commentVisibilityAccess:
              object.accessControl.commentVisibilityAccessData.access,
          }
        );
    }
  }

  // TODO use neverthrow
  @WildrExceptionDecorator()
  async checkMessageReactionAccess({
    object,
    currentUser,
    messageType,
    parentType,
  }: {
    object: ObjectWithCommentAccessControl;
    currentUser?: UserEntity;
    messageType: MessageType;
    parentType: MessageParentType;
  }): Promise<UserEntity> {
    if (!currentUser) throw new ForbiddenException('Login to react');
    if (object.authorId === currentUser.id) return currentUser;
    if (!object.accessControl) {
      if (object instanceof PostEntity) {
        object.accessControl = this.getBackwardsCompatibleAccessControl(object);
      } else {
        object.accessControl = defaultChallengeAccessControl();
      }
    }
    switch (object.accessControl.commentPostingAccessData.access) {
      case CommentPostingAccess.EVERYONE:
        break;
      case CommentPostingAccess.FOLLOWERS:
        const followerIndex = await this.feedService.findIndex(
          toFeedId(FeedEntityType.FOLLOWER, object.authorId),
          currentUser.id
        );
        if (followerIndex === -1)
          throw new ForbiddenException(
            `Only the author's followers can react to ${pluralize(
              messageType
            )} on this ${parentType}`,
            {
              exceptionCode: ForbiddenExceptionCodes.FOLLOWING_REQUIRED,
            }
          );
        break;
      case CommentPostingAccess.INNER_CIRCLE:
        const innerCircleIndex = await this.userListService.findIndex(
          innerCircleListId(object.authorId),
          currentUser.id
        );
        if (innerCircleIndex === -1)
          throw new ForbiddenException(
            `Only the author's inner circle can react to ${pluralize(
              messageType
            )} on this ${parentType}`,
            {
              exceptionCode: ForbiddenExceptionCodes.INNER_CIRCLE_REQUIRED,
            }
          );
        break;
      default:
        throw new InternalServerErrorException(
          `[checkReactionAccessForMessage] Invalid access control`,
          {
            postId: object.id,
            commentVisibilityAccess:
              object.accessControl.commentVisibilityAccessData.access,
          }
        );
    }
    return currentUser;
  }

  private async userIsBlockedFromCommenting({
    parentId,
    userId,
    parentType,
  }: {
    parentId: string;
    userId: string;
    parentType: MessageParentType;
  }): Promise<Result<boolean, InternalServerErrorException>> {
    try {
      const feed = await this.feedService.find(
        toFeedId(
          parentType === 'challenge'
            ? FeedEntityType.BLOCKED_COMMENTERS_ON_CHALLENGE
            : FeedEntityType.BLOCKED_COMMENTERS_ON_POST,
          parentId
        )
      );
      if (!feed) return ok(false);
      return ok(feed.hasEntry(userId));
    } catch (error) {
      return err(
        new InternalServerErrorException(
          `Unexpected error checking if user blocked from commenting`,
          {
            parentId,
            userId,
            parentType,
            methodName: 'userIsBlockedFromCommenting',
          },
          error
        )
      );
    }
  }

  async checkMessagePostingAccess({
    parent,
    currentUser,
    parentType,
    messageType,
  }: {
    parent: ObjectWithCommentAccessControl;
    currentUser?: UserEntity;
    parentType: MessageParentType;
    messageType: MessageType;
  }): Promise<
    Result<
      void,
      ForbiddenException | NotFoundException | InternalServerErrorException
    >
  > {
    try {
      if (!currentUser)
        return err(
          new ForbiddenException(`Login to ${messageType}`, {
            exceptionCode: ForbiddenExceptionCodes.LOGIN_REQUIRED,
          })
        );
      if (currentUser.isSuspended)
        return err(
          new ForbiddenException(
            `You can't ${messageType} while your account is suspended`,
            {
              exceptionCode: ForbiddenExceptionCodes.USER_SUSPENDED,
            }
          )
        );
      const [userBlockedByAuthor, userBlockedOnPost] = await Promise.all([
        this.userService.hasBlocked({
          userWhoBlockedId: parent.authorId,
          userIdToCheck: currentUser.id,
        }),
        this.userIsBlockedFromCommenting({
          parentId: parent.id,
          userId: currentUser.id,
          parentType,
        }),
      ]);
      if (userBlockedByAuthor)
        return err(new ForbiddenException(kSomethingWentWrong));
      if (userBlockedOnPost.isErr()) return err(userBlockedOnPost.error);
      if (userBlockedOnPost.value)
        return err(
          new ForbiddenException(
            `The author of this ${parentType} has blocked you from commenting`,
            {
              exceptionCode: ForbiddenExceptionCodes.BLOCKED_FROM_COMMENTING,
            }
          )
        );
      if (!parent.accessControl) {
        if (parent instanceof PostEntity) {
          parent.accessControl =
            this.getBackwardsCompatibleAccessControl(parent);
        } else {
          parent.accessControl = defaultChallengeAccessControl();
        }
      }
      switch (parent.accessControl.commentPostingAccessData.access) {
        case CommentPostingAccess.NONE:
          return err(
            new ForbiddenException(
              `Comments are disabled on this ${parentType}`,
              {
                exceptionCode:
                  ForbiddenExceptionCodes.COMMENTS_DISABLED_ON_POST,
              }
            )
          );
        case CommentPostingAccess.EVERYONE:
          return ok(undefined);
        case CommentPostingAccess.FOLLOWERS:
          if (currentUser.id === parent.authorId) return ok(undefined);
          const followerIndex = await this.feedService.findIndex(
            toFeedId(FeedEntityType.FOLLOWER, parent.authorId),
            currentUser.id
          );
          if (followerIndex === -1) {
            return err(
              new ForbiddenException(
                `Only the author's followers can comment on this ${parentType}`,
                {
                  exceptionCode: ForbiddenExceptionCodes.FOLLOWING_REQUIRED,
                }
              )
            );
          }
          return ok(undefined);
        case CommentPostingAccess.INNER_CIRCLE:
          if (currentUser.id === parent.authorId) return ok(undefined);
          const index = await this.userListService.findIndex(
            innerCircleListId(parent.authorId),
            currentUser.id
          );
          if (index === -1) {
            return err(
              new ForbiddenException(
                `Only the author's inner circle can comment on this ${parentType}`,
                {
                  exceptionCode: ForbiddenExceptionCodes.INNER_CIRCLE_REQUIRED,
                }
              )
            );
          }
          return ok(undefined);
        case CommentPostingAccess.LIST:
          return ok(undefined);
      }
    } catch (error) {
      return err(
        new InternalServerErrorException(
          `Unexpected error checking message posting access`,
          {
            parentId: parent.id,
            parentType,
            messageType,
            userId: currentUser?.id,
            methodName: 'checkMessagePostingAccess',
          },
          error
        )
      );
    }
  }

  /**
   * Use in conjunction with `checkMessagePostingAccess` to check if a user can
   * reply to a comment
   */
  async checkReplyAccess({
    commentOrId,
    currentUser,
  }: {
    commentOrId: string | CommentEntity;
    currentUser?: UserEntity;
  }): Promise<
    Result<
      void,
      ForbiddenException | NotFoundException | InternalServerErrorException
    >
  > {
    try {
      if (!currentUser)
        return err(
          new ForbiddenException('Login to reply', {
            exceptionCode: ForbiddenExceptionCodes.LOGIN_REQUIRED,
          })
        );
      const comment =
        commentOrId instanceof CommentEntity
          ? commentOrId
          : await this.commentRepo.findOne(commentOrId);
      if (!comment)
        return err(
          new NotFoundException(`Sorry, comment not found`, {
            commentId: commentOrId,
            userId: currentUser.id,
            methodName: 'checkReplyAccess',
            errorCode: NotFoundExceptionCodes.COMMENT_NOT_FOUND,
          })
        );
      const hasBlocked = await this.userService.hasBlocked({
        userWhoBlockedId: comment.authorId,
        userIdToCheck: currentUser.id,
      });
      if (hasBlocked)
        return err(
          new ForbiddenException(kSomethingWentWrong, {
            exceptionCode: ForbiddenExceptionCodes.BLOCKED_BY_COMMENT_AUTHOR,
          })
        );
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          `Unexpected error checking reply access`,
          {
            commentId: commentOrId,
            userId: currentUser?.id,
            methodName: 'checkReplyAccess',
          },
          error
        )
      );
    }
  }
}
