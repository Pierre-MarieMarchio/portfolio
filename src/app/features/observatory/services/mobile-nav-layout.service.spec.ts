import { TestBed } from '@angular/core/testing';
import { MOBILE_NAV_LAYOUT } from '@shared/mobile-nav/ports';
import { MobileNavLayoutService } from './mobile-nav-layout.service';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';
import { onPlatform, Platform } from '@testing/fixtures/testbed.fixture';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

const layoutOn = (platform: Platform) => {
  onPlatform(platform);
  TestBed.configureTestingModule({
    providers: [
      { provide: MOBILE_NAV_LAYOUT, useClass: MobileNavLayoutService },
    ],
  });
  return TestBed.inject(MOBILE_NAV_LAYOUT);
};

describe('MobileNavLayoutService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is not compact on the server', () => {
    expect(layoutOn('server').isCompact()).toBe(false);
  });

  it('is compact on a phone in the browser', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);

    expect(layoutOn('browser').isCompact()).toBe(true);
  });

  it('is not compact on a desktop in the browser', () => {
    stubMedia();
    resizeTo(1440, 900);

    expect(layoutOn('browser').isCompact()).toBe(false);
  });
});
