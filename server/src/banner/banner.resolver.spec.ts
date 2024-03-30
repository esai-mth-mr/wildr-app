import { BannerResolver } from '@verdzie/server/banner/banner.resolver';
import { BannerNotFoundException } from '@verdzie/server/banner/banner.service';
import { BannerEntityFake } from '@verdzie/server/banner/testing/banner.entity.fake';
import { kSomethingWentWrong } from '@verdzie/server/common';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { PostgresTransactionFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserNotFoundException } from '@verdzie/server/user/user.service';
import { err, ok } from 'neverthrow';

describe(BannerResolver.name, () => {
  let resolver: BannerResolver;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [BannerResolver],
    });
    resolver = module.get<BannerResolver>(BannerResolver);
  });

  describe('getBanners', () => {
    it('should return an empty array if the user is not authenticated', async () => {
      const result = await resolver.getBanners(undefined);
      expect(result).toEqual({ banners: [] });
    });

    it('should return an empty array if the user has no banners', async () => {
      const user = UserEntityFake();
      resolver['bannerService'].getApplicableBannersForUser = jest
        .fn()
        .mockReturnValueOnce(ok([]));
      const result = await resolver.getBanners(user);
      expect(result).toEqual({ banners: [] });
    });

    it('should return an empty array if banner service errs', async () => {
      const user = UserEntityFake();
      resolver['bannerService'].getApplicableBannersForUser = jest
        .fn()
        .mockResolvedValueOnce(err('error'));
      const result = await resolver.getBanners(user);
      expect(result).toEqual({ banners: [] });
    });

    it('should return an empty array if banner transporter errs', async () => {
      const user = UserEntityFake();
      resolver['bannerService'].getApplicableBannersForUser = jest
        .fn()
        .mockReturnValueOnce(ok([UserEntityFake()]));
      resolver['bannerTransporter'].getGqlBannerFromBannerEntity = jest
        .fn()
        .mockResolvedValue(err('error'));
      const result = await resolver.getBanners(user);
      expect(result).toEqual({ banners: [] });
    });

    it('should return an array of banners if the user has banners', async () => {
      const user = UserEntityFake();
      const banner = BannerEntityFake();
      resolver['bannerService'].getApplicableBannersForUser = jest
        .fn()
        .mockReturnValueOnce(ok([banner]));
      resolver['bannerTransporter'].getGqlBannerFromBannerEntity = jest
        .fn()
        .mockImplementation(async ({ banner }) => ok(banner));
      const result = await resolver.getBanners(user);
      expect(result).toEqual({ banners: [banner] });
      expect(
        resolver['bannerTransporter'].getGqlBannerFromBannerEntity
      ).toBeCalledWith({
        banner,
      });
    });
  });

  describe('skipBanner', () => {
    it('should return success false if user not authenticated', async () => {
      // @ts-expect-error
      const result = await resolver.skipBanner(undefined);
      expect(result).toEqual({
        __typename: 'SkipBannerResult',
        success: false,
      });
    });

    it('should return smart error if the banner is not found', async () => {
      const user = UserEntityFake();
      const bannerId = 'bannerId';
      resolver['bannerService'].skipBannerForUser = jest
        .fn()
        .mockResolvedValueOnce(err(new BannerNotFoundException()));
      const result = await resolver.skipBanner(user, { bannerId });
      expect(result).toEqual({
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      });
    });

    it('should return a smart error if the user is not found', async () => {
      const user = UserEntityFake();
      const bannerId = 'bannerId';
      resolver['bannerService'].skipBannerForUser = jest
        .fn()
        .mockResolvedValueOnce(err(new UserNotFoundException()));
      const result = await resolver.skipBanner(user, { bannerId });
      expect(result).toEqual({
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      });
    });

    it('should return smart error if the transaction fails', async () => {
      const user = UserEntityFake();
      const bannerId = 'bannerId';
      resolver['bannerService'].skipBannerForUser = jest
        .fn()
        .mockResolvedValueOnce(err(new PostgresTransactionFailedException()));
      const result = await resolver.skipBanner(user, { bannerId });
      expect(result).toEqual({
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      });
    });

    it('should return success true if the banner is skipped', async () => {
      const user = UserEntityFake();
      const bannerId = 'bannerId';
      resolver['bannerService'].skipBannerForUser = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      const result = await resolver.skipBanner(user, { bannerId });
      expect(result).toEqual({
        __typename: 'SkipBannerResult',
        success: true,
      });
    });
  });
});
