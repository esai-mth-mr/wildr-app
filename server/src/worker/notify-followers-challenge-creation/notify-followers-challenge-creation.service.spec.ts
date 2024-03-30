import { getFirstPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { NotifyFollowersOfChallengeCreationService } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.service';

describe('NotifyFollowersOfChallengeCreationService', () => {
  let service: NotifyFollowersOfChallengeCreationService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [NotifyFollowersOfChallengeCreationService],
    });
    service = module.get(NotifyFollowersOfChallengeCreationService);
  });

  describe('notifyAllFollowers', () => {
    it('should return if the challenge is not found', async () => {
      service['challengeService'].findById = jest.fn().mockResolvedValue(null);
      await service.notifyAllFollowers({ challengeId: '1' });
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: '1',
      });
      expect(service['feedService'].findAllPagesById).not.toHaveBeenCalled();
    });

    it('should return if the challenge author followers feed is not found', async () => {
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        authorId: '1',
      });
      service['feedService'].findAllPagesById = jest
        .fn()
        .mockResolvedValue(null);
      await service.notifyAllFollowers({ challengeId: '1' });
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: '1',
      });
      expect(service['feedService'].findAllPagesById).toHaveBeenCalledWith(
        getFirstPageId(toFeedId(FeedEntityType.FOLLOWER, '1'))
      );
    });

    it('should return if the challenge author feed has no pages', async () => {
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        authorId: '1',
      });
      service['feedService'].findAllPagesById = jest.fn().mockResolvedValue([]);
      await service.notifyAllFollowers({ challengeId: '1' });
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: '1',
      });
      expect(service['feedService'].findAllPagesById).toHaveBeenCalledWith(
        getFirstPageId(toFeedId(FeedEntityType.FOLLOWER, '1'))
      );
      expect(
        service['notifyFollowersOfChallengeCreationProducer']
          .notifyFollowerBatch
      ).not.toHaveBeenCalled();
    });

    it('should return if challenge author is not found', async () => {
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        authorId: '1',
      });
      service['userService'].findById = jest.fn().mockResolvedValue(null);
      service['feedService'].findAllPagesById = jest
        .fn()
        .mockResolvedValue([FeedEntityFake()]);
      await service.notifyAllFollowers({ challengeId: '1' });
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: '1',
      });
      expect(service['feedService'].findAllPagesById).toHaveBeenCalledWith(
        getFirstPageId(toFeedId(FeedEntityType.FOLLOWER, '1'))
      );
      expect(
        service['notifyFollowersOfChallengeCreationProducer']
          .notifyFollowerBatch
      ).not.toHaveBeenCalled();
    });

    it('should create small batches of follower ids and create a job for each to reduce load', async () => {
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        authorId: '1',
        cover: {
          coverImage: {
            thumbnail: 'thumbnail',
          },
        },
      });
      const fakeFeeds = Array.from({ length: 2 }, (_, i) => {
        const feed = FeedEntityFake();
        feed.ids = Array.from({ length: 150 }, (_, j) => `${i}${j}`);
        return feed;
      });
      service['feedService'].findAllPagesById = jest
        .fn()
        .mockResolvedValue(fakeFeeds as any);
      service['userService'].findById = jest.fn().mockResolvedValue({
        handle: 'handle',
      });
      service[
        'notifyFollowersOfChallengeCreationProducer'
      ].notifyFollowerBatch = jest.fn();
      await service.notifyAllFollowers({ challengeId: '1' });
      expect(service['challengeService'].findById).toHaveBeenCalledWith({
        id: '1',
      });
      expect(service['feedService'].findAllPagesById).toHaveBeenCalledWith(
        getFirstPageId(toFeedId(FeedEntityType.FOLLOWER, '1'))
      );
      expect(
        service['notifyFollowersOfChallengeCreationProducer']
          .notifyFollowerBatch
      ).toHaveBeenCalledTimes(6);
      const fn = service['notifyFollowersOfChallengeCreationProducer'];
      // @ts-ignore
      const jobCalls = fn.notifyFollowerBatch.mock.calls;
      expect(jobCalls[0][0].jobData.followerIds).toHaveLength(50);
      expect(jobCalls[1][0].jobData.followerIds).toHaveLength(50);
      expect(jobCalls[2][0].jobData.followerIds).toHaveLength(50);
    });

    it('should catch errors during batch creation to prevent duplicate notifications', async () => {
      service['challengeService'].findById = jest.fn().mockResolvedValue({
        authorId: '1',
        cover: {
          coverImage: {
            thumbnail: 'thumbnail',
          },
        },
      });
      const fakeFeeds = Array.from({ length: 2 }, (_, i) => {
        const feed = FeedEntityFake();
        feed.ids = Array.from({ length: 150 }, (_, j) => `${i}${j}`);
        return feed;
      });
      service['feedService'].findAllPagesById = jest
        .fn()
        .mockResolvedValue(fakeFeeds as any);
      service['userService'].findById = jest.fn().mockResolvedValue({
        handle: 'handle',
      });
      service[
        'notifyFollowersOfChallengeCreationProducer'
      ].notifyFollowerBatch = jest.fn().mockRejectedValue(new Error('error'));
      await service.notifyAllFollowers({ challengeId: '1' });
    });
  });

  describe('notifyFollowerBatch', () => {
    it('should call the activity service for each follower', async () => {
      service['activityService'].followeeCreatedChallenge = jest.fn();
      await service.notifyFollowerBatch({
        followerIds: ['1', '2'],
        challengeId: '1',
      });
      expect(
        service['activityService'].followeeCreatedChallenge
      ).toHaveBeenCalledTimes(2);
      expect(
        service['activityService'].followeeCreatedChallenge
      ).toHaveBeenCalledWith({
        challengeId: '1',
        followerId: '1',
      });
    });

    it('should catch errors to prevent duplicate notifications', async () => {
      service['activityService'].followeeCreatedChallenge = jest
        .fn()
        .mockRejectedValue(new Error('error'));
      await service.notifyFollowerBatch({
        followerIds: ['1', '2'],
        challengeId: '1',
      });
    });
  });
});
