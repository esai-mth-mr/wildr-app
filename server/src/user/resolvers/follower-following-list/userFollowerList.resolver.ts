import { Context, ResolveField, Resolver } from '@nestjs/graphql';
import { FeedEntity } from '../../../feed/feed.entity';
import { UserFollowersEdge } from '../../../generated-graphql';
import { User } from '../../../graphql';
import { UserEntity } from '../../user.entity';
import { UserService } from '../../user.service';

@Resolver('UserFollowersList')
export class UserFollowerListResolver {
  constructor(private userService: UserService) {}

  @ResolveField(() => [UserFollowersEdge], { name: 'edges' })
  async edges(@Context('feed') feed: FeedEntity) {
    const users: UserEntity[] = await this.userService.findAllById(
      feed.page.ids
    );
    const entries: User[] = users
      .map(user => this.userService.toUserObject({ user }))
      .filter((user): user is User => user !== undefined);

    const edges: UserFollowersEdge[] =
      entries?.map(entry => ({
        __typename: 'UserFollowersEdge',
        node: entry,
        cursor: entry.id,
      })) ?? [];
    return edges;
  }
}
