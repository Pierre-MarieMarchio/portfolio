import { ɵIS_HYDRATION_DOM_REUSE_ENABLED } from '@angular/core';
import { appConfig, hydrationProviders } from './app.config';

const providedTokens = (providers: unknown): unknown[] => {
  if (Array.isArray(providers))
    return providers.flatMap((item) => providedTokens(item));
  if (typeof providers !== 'object' || providers === null) return [];
  if ('ɵproviders' in providers) return providedTokens(providers.ɵproviders);
  return 'provide' in providers ? [providers.provide] : [];
};

describe('appConfig hydration', () => {
  it('reuses the prerendered DOM', () => {
    expect(providedTokens(hydrationProviders[0])).toContain(
      ɵIS_HYDRATION_DOM_REUSE_ENABLED,
    );
  });

  it('replays the gestures made before the application starts', () => {
    const replayTokens = providedTokens(hydrationProviders[1]);
    expect(replayTokens.length).toBeGreaterThan(0);
    expect(replayTokens).not.toContain(ɵIS_HYDRATION_DOM_REUSE_ENABLED);
  });

  it('registers both in the application config', () => {
    expect(hydrationProviders).toHaveLength(2);
    expect(appConfig.providers).toContain(hydrationProviders);
  });
});
