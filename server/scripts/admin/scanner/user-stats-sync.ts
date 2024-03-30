import '../../../tsconfig-paths-bootstrap';
import '../../../env/admin-local-config';

import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { adminClient } from '@verdzie/scripts/admin/util/admin-client';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { UserListEntityFake } from '@verdzie/server/user-list/testing/userList.entity.fake';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { In } from 'typeorm';
import assert from 'assert';

export function startScan(workflowId: WorkflowId) {
  return adminClient.post(`/scanner/request-scan`, { workflowId });
}

const generateUserFeeds = ({
  user,
  count,
}: {
  user: UserEntity;
  count: number;
}) => {
  const feedTypes = [
    FeedEntityType.FOLLOWING,
    FeedEntityType.FOLLOWER,
    FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS,
  ];
  const feeds = feedTypes.map(feedType =>
    FeedEntityFake({
      id: toFeedId(feedType, user.id),
      ids: Array.from({ length: count }, () => user.id),
    })
  );
  return feeds;
};

const generateUserInnerCircleList = ({
  user,
  count,
}: {
  user: UserEntity;
  count: number;
}) => {
  const innerCircleFeed = UserListEntityFake({
    id: innerCircleListId(user.id),
    ids: Array.from({ length: count }, () => user.id),
  });
  return innerCircleFeed;
};

async function main() {
  const conn = await getTestConnection();
  const userRepo = conn.getRepository(UserEntity);
  await userRepo.delete({});
  const users = Array.from({ length: 2000 }, () => UserEntityFake({}));
  const allFeeds = users.flatMap(user =>
    generateUserFeeds({ user, count: 10 })
  );
  const allInnerCircleLists = users.map(user =>
    generateUserInnerCircleList({ user, count: 10 })
  );
  await conn.getRepository(FeedEntity).insert(allFeeds);
  await conn.getRepository(UserListEntity).insert(allInnerCircleLists);
  await userRepo.insert(users);
  await startScan(WorkflowId.USER_STATS_SYNC);
  await new Promise(r => setTimeout(r, 10000));
  const usersWithStats = await userRepo.find({
    where: { id: In(users.map(u => u.id)) },
  });
  assert(usersWithStats.length === users.length);
  usersWithStats.forEach(user => {
    assert(user._stats?.followerCount === 10);
    assert(user._stats?.followingCount === 10);
    assert(user._stats?.postCount === 10);
    assert(user._stats?.innerCircleCount === 10);
  });
  await conn.close();
}

main();
