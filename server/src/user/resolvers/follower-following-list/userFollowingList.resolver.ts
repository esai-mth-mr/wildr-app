import { Context, ResolveField, Resolver } from '@nestjs/graphql';
import { FeedEntity } from '../../../feed/feed.entity';
import { UserFollowingsEdge } from '../../../generated-graphql';
import { User } from '../../../graphql';
import { UserEntity } from '../../user.entity';
import { UserService } from '../../user.service';

@Resolver('UserFollowingsList')
export class UserFollowingsListResolver {
  constructor(private userService: UserService) {}

  @ResolveField(() => [UserFollowingsEdge], { name: 'edges' })
  async edges(
    @Context('feed') feed: FeedEntity
  ): Promise<UserFollowingsEdge[]> {
    const users: UserEntity[] = await this.userService.findAllById(
      feed.page.ids
    );
    const entries: User[] = users
      .map(user => this.userService.toUserObject({ user }))
      .filter((user): user is User => user !== undefined);
    const edges: UserFollowingsEdge[] =
      entries?.map(entry => ({
        __typename: 'UserFollowingsEdge',
        node: entry,
        cursor: entry.id,
      })) ?? [];
    return edges;
  }
}
