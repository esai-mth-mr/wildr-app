import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WebAppFeatureFlagsService } from '@verdzie/server/web-app-feature-flags/web-app-feature-flags.service';

describe(WebAppFeatureFlagsService.name, () => {
  let service: WebAppFeatureFlagsService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [WebAppFeatureFlagsService],
    });
    service = module.get(WebAppFeatureFlagsService);
  });

  describe(WebAppFeatureFlagsService.prototype.getFeatureFlags.name, () => {
    it('should return the feature flags', () => {
      // @ts-expect-error
      service['webAppFeatureFlags'] = {
        feature1: true,
        feature2: false,
      };
      expect(service.getFeatureFlags()).toEqual({
        feature1: true,
        feature2: false,
      });
    });
  });
});
