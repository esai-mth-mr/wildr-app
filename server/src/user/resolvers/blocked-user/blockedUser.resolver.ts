import { Context, ResolveField, Resolver } from '@nestjs/graphql';
import { FeedEntity } from '../../../feed/feed.entity';
import { BlockedUsersEdge } from '../../../generated-graphql';
import { User } from '../../../graphql';
import { UserEntity } from '../../user.entity';
import { UserService } from '../../user.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';

@Resolver('BlockedUsersList')
export class BlockedUsersListResolver {
  constructor(private userService: UserService) {}

  @ResolveField(() => [BlockedUsersEdge], { name: 'edges' })
  @UseGuards(JwtAuthGuard)
  async edges(@Context('feed') feed: FeedEntity): Promise<BlockedUsersEdge[]> {
    const users: UserEntity[] = await this.userService.findAllById(
      feed.page.ids
    );
    const entries: User[] = users
      .map(user => this.userService.toUserObject({ user }))
      .filter((user): user is User => user !== undefined);
    const edges: BlockedUsersEdge[] =
      entries?.map(entry => ({
        __typename: 'BlockedUsersEdge',
        node: entry,
        cursor: entry.id,
      })) ?? [];
    return edges;
  }
}
