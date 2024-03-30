import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { FeedsForBuildingUserPersonalizedFeed } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import {
  createMockConnection,
  createMockQueryRunner,
  createMockRepo,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UpdateUserExploreFeedConsumer } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.consumer';

describe('UpdateUserExploreFeedConsumer', () => {
  let consumer: UpdateUserExploreFeedConsumer;

  beforeEach(async () => {
    consumer = (
      await createMockedTestingModule({
        providers: [
          UpdateUserExploreFeedConsumer,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {},
          },
        ],
      })
    ).get(UpdateUserExploreFeedConsumer);
  });

  describe('updateUserExploreFeedsInTxn', () => {
    it('should throw if a feed cannot be found or created', async () => {
      const user = UserEntityFake();
      const userRepo = createMockRepo({ entities: [user] });
      const existingFeeds = FeedsForBuildingUserPersonalizedFeed.slice(1).map(
        type => FeedEntityFake({ id: toFeedId(type, user.id) })
      );
      const feedRepo = createMockRepo({
        entities: existingFeeds,
      });
      feedRepo.findByIds = jest
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'));
      // @ts-expect-error - (connection is private)
      consumer['connection'] = createMockConnection({});
      // @ts-expect-error - (userRepo is private)
      consumer['userRepo'] = userRepo;
      consumer['connection'].createQueryRunner = () =>
        createMockQueryRunner({
          repositories: {
            FeedEntity: feedRepo,
            UserEntity: userRepo,
          },
        }) as any;
      try {
        await consumer.updateUserExploreFeedsInTxn({
          data: { userId: user.id },
        } as any);
        throw new Error('Should not reach here');
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('should rollback transaction if an error occurs', async () => {
      const user = UserEntityFake();
      user.lastSeenCursorPersonalizedFeed = '';
      const userRepo = createMockRepo({ entities: [user] });
      const existingFeeds = FeedsForBuildingUserPersonalizedFeed.map(type =>
        FeedEntityFake({ id: toFeedId(type, user.id) })
      );
      const feedRepo = createMockRepo({
        entities: existingFeeds,
      });
      // @ts-expect-error - (connection is private)
      consumer['connection'] = createMockConnection({});
      // @ts-expect-error - (userRepo is private)
      consumer['userRepo'] = userRepo;
      const queryRunner = createMockQueryRunner({
        repositories: {
          UserEntity: userRepo,
          FeedEntity: feedRepo,
        },
      }) as any;
      queryRunner.commitTransaction = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error'));
      consumer['connection'].createQueryRunner = () => queryRunner;
      try {
        await consumer.updateUserExploreFeedsInTxn({
          data: { userId: user.id },
        } as any);
        throw new Error('Should not reach here');
      } catch (e) {
        // @ts-expect-error
        expect(e?.message).toEqual('error updating user explore feed');
      }
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('removeConsumedPostsFromFeeds', () => {
    it('should remove consumed posts from relevant feed', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['1', '2', '3', '4', '5'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '2',
        feedCursors: { startOfConsumed: '4' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(relevantPostsFeed.page.idsWithScore.idsMap).toEqual({
        '3': 3,
      });
    });

    it('should remove consumed posts from relevant feed when there are new posts', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['1', '2', '3', '4', '5'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
              '6': 6,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '2',
        feedCursors: { startOfConsumed: '4' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(relevantPostsFeed.page.idsWithScore.idsMap).toEqual({
        '3': 3,
        '6': 6,
      });
    });

    it('should remove a single consumed post from the relevant feed', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['1', '2', '3', '4', '5'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
              '6': 6,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '1',
        feedCursors: { startOfConsumed: '4' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(relevantPostsFeed.page.idsWithScore.idsMap).toEqual({
        '2': 2,
        '3': 3,
        '6': 6,
      });
    });

    it('should splice out unconsumed posts from the all posts feed', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['1', '2', '3', '4', '5'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
              '4': 5,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '2',
        feedCursors: { startOfConsumed: '4' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(allPostsFeed.page.ids).toEqual(['1', '2', '4', '5']);
    });

    it('should splice out all posts from the all posts before old posts if none are consumed', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['1', '2', '3', '4', '5'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
              '4': 4,
              '5': 5,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '',
        feedCursors: { startOfConsumed: '5' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(allPostsFeed.page.ids).toEqual(['5']);
    });

    it('should not remove any posts from relevant feed if none are consumed', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['5', '4', '3', '2', '1'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
              '4': 4,
              '5': 5,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '',
        feedCursors: { startOfConsumed: '1' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(relevantPostsFeed.page.idsWithScore.idsMap).toEqual({
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
      });
    });

    it('should remove consumed posts when the start of consumption cursor does not exist', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['4', '3', '2', '1'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
              '4': 4,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '2',
        feedCursors: { startOfConsumed: '' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(relevantPostsFeed.page.idsWithScore.idsMap).toEqual({
        '1': 1,
      });
    });

    it('should not splice out unconsumed posts when there is no start of consumed', () => {
      const allPostsFeed = FeedEntityFake({
        page: {
          ids: ['4', '3', '2', '1'],
          idsWithScore: { idsMap: {} },
        },
      });
      const relevantPostsFeed = FeedEntityFake({
        page: {
          ids: [],
          idsWithScore: {
            idsMap: {
              '1': 1,
              '2': 2,
              '3': 3,
              '4': 4,
              '5': 5,
            },
          },
        },
      });
      const user = UserEntityFake({
        lastSeenCursorPersonalizedFeed: '3',
        feedCursors: { startOfConsumed: '' },
      });
      consumer['removeConsumedPostsFromFeeds']({
        allPostsFeed,
        relevantPostsFeed,
        user,
      });
      expect(allPostsFeed.page.ids).toEqual(['4', '3', '2', '1']);
      expect(relevantPostsFeed.page.idsWithScore.idsMap).toEqual({
        '1': 1,
        '2': 2,
        '5': 5,
      });
    });
  });
});
