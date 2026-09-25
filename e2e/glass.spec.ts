import type { Locator, Page, TestInfo } from '@playwright/test';
import { expect, openHydrated, sizeOf, test } from './site.fixture';

type Point = { readonly x: number; readonly y: number };
type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};
type Viewport = { readonly width: number; readonly height: number };

const PORTRAIT_SIZES = new Set(['phone-xs', 'phone-s', 'phone']);
const LANDSCAPE_SIZES = new Set(['phone-landscape']);
const PAGES = [
  { name: 'index', path: '/projets' },
  { name: 'sheet', path: '/projet/bkone' },
  { name: 'about', path: '/a-propos' },
] as const;

const READ_DISTANCE_PX = 400;
const PULL_DISTANCE_PX = 150;
const RAISED_TOP_BELOW_PX = 80;
const TOUCH_MOVE_STEPS = 12;
const LOWEST_FINGER_FROM_BOTTOM_PX = 120;
const FINGER_INTO_BODY_PX = 60;
const EDGE_TOLERANCE_PX = 1.5;
const SAMPLED_FRAMES = 40;
const MIDWAY_SCROLL_PX = 200;
const FOOT_ROW_PX = 60;

const glassOf = (page: Page): Locator => page.locator('section.window').first();

const railOf = (page: Page): Locator => page.locator('.glass .rail').first();

const boxOf = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('expected a box on screen');
  }
  return box;
};

const viewportOf = (page: Page): Viewport => {
  const size = page.viewportSize();
  if (!size) {
    throw new Error('expected a viewport');
  }
  return size;
};

const topOf = async (page: Page): Promise<number> =>
  (await boxOf(glassOf(page))).y;

const swipeByDevToolsTouch = async (
  page: Page,
  at: Point,
  upwards: number,
): Promise<void> => {
  const session = await page.context().newCDPSession(page);
  const touch = (
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    points: readonly Point[],
  ) =>
    session.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map((point) => ({ x: point.x, y: point.y })),
    });
  await touch('touchStart', [at]);
  for (let step = 1; step <= TOUCH_MOVE_STEPS; step += 1) {
    await touch('touchMove', [
      { x: at.x, y: at.y - (upwards * step) / TOUCH_MOVE_STEPS },
    ]);
  }
  await touch('touchEnd', []);
  await session.detach();
};

const scrollRailBy = (page: Page, upwards: number): Promise<void> =>
  railOf(page).evaluate((rail, top) => {
    rail.scrollBy({ top, behavior: 'instant' });
  }, upwards);

const swipeContent = (
  page: Page,
  browserName: string,
  at: Point,
  upwards: number,
): Promise<void> =>
  browserName === 'chromium'
    ? swipeByDevToolsTouch(page, at, upwards)
    : scrollRailBy(page, upwards);

const fingerOnGlass = async (page: Page): Promise<Point> => {
  const { width, height } = viewportOf(page);
  const body = await boxOf(glassOf(page).locator('.body'));
  return {
    x: width / 2,
    y: Math.min(
      height - LOWEST_FINGER_FROM_BOTTOM_PX,
      body.y + FINGER_INTO_BODY_PX,
    ),
  };
};

const openGlass = async (page: Page, path: string): Promise<void> => {
  await openHydrated(page, path);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect(glassOf(page), 'the glass').toBeVisible();
};

const raiseGlass = async (page: Page, browserName: string): Promise<void> => {
  await swipeContent(
    page,
    browserName,
    await fingerOnGlass(page),
    READ_DISTANCE_PX,
  );
  await expect
    .poll(() => topOf(page), 'glass top after reading, in px')
    .toBeLessThan(RAISED_TOP_BELOW_PX);
};

const skyBlurAboveOf = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const lead = document.querySelector('.glass .lead');
    if (!lead) {
      throw new Error('expected the sky above the glass');
    }
    const filter = getComputedStyle(lead).backdropFilter;
    const blur = /blur\(([\d.]+)px\)/.exec(filter);
    return blur ? Number(blur[1]) : 0;
  });

type SkyReading = { readonly spread: number; readonly contrast: number };

const SKY_PAGES = [
  { name: 'sheet', path: '/projet/bkone', spreadWithTwoFilters: 0.00245 },
  { name: 'about', path: '/a-propos', spreadWithTwoFilters: 0.00166 },
] as const;
const SKY_SIZE = 'phone';
const SKY_ENGINE = 'chromium';
const MIN_SPREAD_GAIN = 1.15;
const MIN_INK_CONTRAST = 4.5;
const BRIGHT_PERCENTILE = 0.999;
const CONTENT_HIDDEN =
  'section.window { color: transparent !important; } section.window .body * { visibility: hidden !important; }';

const skyUnderTheBody = async (page: Page): Promise<SkyReading> => {
  await page.addStyleTag({ content: CONTENT_HIDDEN });
  const body = await boxOf(glassOf(page).locator('.body'));
  const shot = await page.screenshot({ clip: body, animations: 'disabled' });
  return page.evaluate(
    async ({ png, percentile }) => {
      const linear = Array.from({ length: 256 }, (_, value) => {
        const share = value / 255;
        return share <= 0.04045
          ? share / 12.92
          : ((share + 0.055) / 1.055) ** 2.4;
      });
      const luminanceAt = (data: Uint8ClampedArray, at: number): number =>
        0.2126 * (linear[data[at] ?? 0] ?? 0) +
        0.7152 * (linear[data[at + 1] ?? 0] ?? 0) +
        0.0722 * (linear[data[at + 2] ?? 0] ?? 0);
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const board = document.createElement('canvas');
      board.width = image.width;
      board.height = image.height;
      const pen = board.getContext('2d');
      if (!pen) {
        throw new Error('expected a 2d context');
      }
      pen.drawImage(image, 0, 0);
      const pixels = pen.getImageData(0, 0, board.width, board.height).data;
      const levels: number[] = [];
      for (let at = 0; at < pixels.length; at += 4) {
        levels.push(luminanceAt(pixels, at));
      }
      levels.sort((a, b) => a - b);
      const mean =
        levels.reduce((sum, level) => sum + level, 0) / levels.length;
      const variance =
        levels.reduce((sum, level) => sum + (level - mean) ** 2, 0) /
        levels.length;
      const bright =
        levels[
          Math.min(levels.length - 1, Math.floor(levels.length * percentile))
        ] ?? 0;
      const probe = document.createElement('span');
      probe.style.color = 'var(--ink-2)';
      document.body.append(probe);
      pen.fillStyle = getComputedStyle(probe).color;
      probe.remove();
      pen.fillRect(0, 0, 1, 1);
      const ink = luminanceAt(pen.getImageData(0, 0, 1, 1).data, 0);
      return {
        spread: Math.sqrt(variance),
        contrast: (ink + 0.05) / (bright + 0.05),
      };
    },
    { png: shot.toString('base64'), percentile: BRIGHT_PERCENTILE },
  );
};

const filtersUnderTheBody = (page: Page): Promise<string[]> =>
  glassOf(page)
    .locator('.body')
    .evaluate((body, tolerance) => {
      const area = body.getBoundingClientRect();
      const isUnder = (box: DOMRect): boolean =>
        box.left < area.right - tolerance &&
        area.left < box.right - tolerance &&
        box.top < area.bottom - tolerance &&
        area.top < box.bottom - tolerance;
      return [...document.querySelectorAll<HTMLElement>('body *')]
        .filter(
          (element) =>
            !['', 'none'].includes(
              getComputedStyle(element).getPropertyValue('backdrop-filter'),
            ) && isUnder(element.getBoundingClientRect()),
        )
        .map((element) => [element.localName, ...element.classList].join('.'));
    }, EDGE_TOLERANCE_PX);

const railTopsAfterMidwayScroll = (
  page: Page,
  frames: number,
  midway: number,
): Promise<number[]> =>
  page.evaluate(
    ({ frameCount, at }) => {
      const rail = document.querySelector('.glass .rail');
      if (!rail) {
        throw new Error('expected a rail');
      }
      rail.scrollTop = at;
      return new Promise<number[]>((resolve) => {
        const tops: number[] = [];
        const sample = (): void => {
          tops.push(rail.scrollTop);
          if (tops.length < frameCount) {
            requestAnimationFrame(sample);
          } else {
            resolve(tops);
          }
        };
        requestAnimationFrame(sample);
      });
    },
    { frameCount: frames, at: midway },
  );

const endTopOf = (page: Page): Promise<number> =>
  railOf(page).evaluate((rail) => rail.scrollHeight - rail.clientHeight);

const isBetween = (value: number, low: number, high: number): boolean =>
  value > low + EDGE_TOLERANCE_PX && value < high - EDGE_TOLERANCE_PX;

const skipOffPortrait = (testInfo: TestInfo): void => {
  testInfo.skip(!PORTRAIT_SIZES.has(sizeOf(testInfo)), 'the phone, upright');
};

const skipOffPhone = (testInfo: TestInfo): void => {
  testInfo.skip(
    !PORTRAIT_SIZES.has(sizeOf(testInfo)) &&
      !LANDSCAPE_SIZES.has(sizeOf(testInfo)),
    'the phone',
  );
};

for (const { name, path } of PAGES) {
  test(`opens the glass low, ${name}`, async ({ page }, testInfo) => {
    skipOffPortrait(testInfo);
    await openGlass(page, path);

    const share = (await topOf(page)) / viewportOf(page).height;
    expect(share, 'glass top, share of the height').toBeGreaterThanOrEqual(
      0.55,
    );
    expect(share, 'glass top, share of the height').toBeLessThanOrEqual(0.65);
  });

  test(`raises the glass before scrolling its content, ${name}`, async ({
    page,
    browserName,
  }, testInfo) => {
    skipOffPortrait(testInfo);
    await openGlass(page, path);
    const body = glassOf(page).locator('.body');
    await expect(body, 'content held while low').toHaveCSS(
      'overflow-y',
      'hidden',
    );

    await raiseGlass(page, browserName);

    expect(
      await body.evaluate((element) => element.scrollTop),
      'content not scrolled while rising',
    ).toBe(0);
    await expect(body, 'content free once up').toHaveCSS('overflow-y', 'auto');
    const hiddenContent = await body.evaluate(
      (element) => element.scrollHeight - element.clientHeight,
    );
    if (browserName === 'chromium' && hiddenContent > EDGE_TOLERANCE_PX) {
      const raisedTop = await topOf(page);
      await swipeContent(
        page,
        browserName,
        await fingerOnGlass(page),
        PULL_DISTANCE_PX,
      );
      await expect
        .poll(() => body.evaluate((element) => element.scrollTop), 'content')
        .toBeGreaterThan(0);
      expect(await topOf(page), 'glass stays up').toBeCloseTo(raisedTop, 0);
    }
  });

  test(`lowers the glass on a pull from the top of its content, ${name}`, async ({
    page,
    browserName,
  }, testInfo) => {
    skipOffPortrait(testInfo);
    await openGlass(page, path);
    await raiseGlass(page, browserName);

    await swipeContent(
      page,
      browserName,
      await fingerOnGlass(page),
      -PULL_DISTANCE_PX,
    );

    await expect
      .poll(() => topOf(page), 'glass top after the pull, in px')
      .toBeGreaterThan(viewportOf(page).height / 2);
  });

  test(`folds the glass to its title bar at the bottom, ${name}`, async ({
    page,
  }, testInfo) => {
    skipOffPhone(testInfo);
    await openGlass(page, path);
    const glass = glassOf(page);
    const fold = glass.locator('.titlebar button[aria-expanded]');

    await fold.focus();
    await page.keyboard.press('Enter');

    await expect(fold, 'folded').toHaveAttribute('aria-expanded', 'false');
    const titlebar = await boxOf(glass.locator('.titlebar'));
    const folded = await boxOf(glass);
    expect(
      folded.height - titlebar.height,
      'no more than the title bar and its frame',
    ).toBeLessThanOrEqual(2 * EDGE_TOLERANCE_PX);
    const fromBottom = viewportOf(page).height - (folded.y + folded.height);
    expect(fromBottom, 'on screen').toBeGreaterThanOrEqual(-EDGE_TOLERANCE_PX);
    expect(fromBottom, 'at the bottom, above the foot row').toBeLessThanOrEqual(
      FOOT_ROW_PX,
    );

    await fold.focus();
    await page.keyboard.press('Enter');

    await expect(fold, 'unfolded').toHaveAttribute('aria-expanded', 'true');
    await expect(glass.locator('.body'), 'the body is back').toHaveCount(1);
  });

  test(`blurs the sky above the glass more as it rises, ${name}`, async ({
    page,
    browserName,
  }, testInfo) => {
    skipOffPortrait(testInfo);
    await openGlass(page, path);
    const lowered = await skyBlurAboveOf(page);

    await raiseGlass(page, browserName);

    await expect
      .poll(() => skyBlurAboveOf(page), 'sky blur above, raised, in px')
      .toBeGreaterThan(lowered);
  });

  test(`lays one filter under the body of the glass, ${name}`, async ({
    page,
    browserName,
  }, testInfo) => {
    skipOffPhone(testInfo);
    await openGlass(page, path);
    expect(await filtersUnderTheBody(page), 'filters, low').toEqual([
      'section.window',
    ]);

    if (PORTRAIT_SIZES.has(sizeOf(testInfo))) {
      await raiseGlass(page, browserName);
      expect(await filtersUnderTheBody(page), 'filters, raised').toEqual([
        'section.window',
      ]);
    }
  });

  test(`gives the glass the right half in landscape, ${name}`, async ({
    page,
  }, testInfo) => {
    testInfo.skip(!LANDSCAPE_SIZES.has(sizeOf(testInfo)), 'phone landscape');
    await openGlass(page, path);
    const { width, height } = viewportOf(page);

    const box = await boxOf(glassOf(page));

    expect(box.x, 'left edge').toBeCloseTo(width / 2, 0);
    expect(box.x + box.width, 'right edge').toBeCloseTo(width, 0);
    expect(box.y, 'top edge').toBeCloseTo(0, 0);
    expect(box.y + box.height, 'bottom edge').toBeCloseTo(height, 0);
  });
}

for (const { name, path, spreadWithTwoFilters } of SKY_PAGES) {
  test(`keeps the sky readable under the raised glass, ${name}`, async ({
    page,
    browserName,
  }, testInfo) => {
    testInfo.skip(
      sizeOf(testInfo) !== SKY_SIZE || browserName !== SKY_ENGINE,
      'measured in Chromium at 390 by 844',
    );
    await openGlass(page, path);
    await raiseGlass(page, browserName);

    const sky = await skyUnderTheBody(page);

    expect(
      sky.spread,
      'luminance spread under the body',
    ).toBeGreaterThanOrEqual(MIN_SPREAD_GAIN * spreadWithTwoFilters);
    expect(sky.contrast, 'ink-2 over the brightest sky').toBeGreaterThanOrEqual(
      MIN_INK_CONTRAST,
    );
  });
}

for (const { name, link } of [
  { name: 'index', link: 'Projets' },
  { name: 'about', link: 'À propos' },
]) {
  test(`keeps the glass low when it takes the focus on arrival, ${name}`, async ({
    page,
  }, testInfo) => {
    skipOffPortrait(testInfo);
    await openHydrated(page, '/');

    await page.locator('.bar').getByRole('link', { name: link }).tap();

    await expect
      .poll(
        () =>
          glassOf(page).evaluate((glass) =>
            glass.contains(document.activeElement),
          ),
        'focus inside the glass',
      )
      .toBe(true);
    const share = (await topOf(page)) / viewportOf(page).height;
    expect(share, 'glass top, share of the height').toBeGreaterThanOrEqual(
      0.55,
    );
    expect(share, 'glass top, share of the height').toBeLessThanOrEqual(0.65);
  });
}

test('settles the glass without a transition when motion is reduced', async ({
  page,
}, testInfo) => {
  skipOffPortrait(testInfo);
  await openGlass(page, '/projets');
  const tops = await railTopsAfterMidwayScroll(
    page,
    SAMPLED_FRAMES,
    MIDWAY_SCROLL_PX,
  );
  const end = await endTopOf(page);

  expect(end, 'room to rise, in px').toBeGreaterThan(MIDWAY_SCROLL_PX);
  expect(
    await railOf(page).evaluate(
      (rail) => getComputedStyle(rail).scrollBehavior,
    ),
    'scroll behaviour',
  ).toBe('auto');
  expect(tops.at(-1), 'settled up').toBeCloseTo(end, 0);
  expect(
    tops.filter((top) => isBetween(top, MIDWAY_SCROLL_PX, end)),
    'frames on the way up',
  ).toEqual([]);
});

test.describe('without reduced motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('settles the glass by a smooth scroll', async ({ page }, testInfo) => {
    skipOffPortrait(testInfo);
    await openGlass(page, '/projets');
    const tops = await railTopsAfterMidwayScroll(
      page,
      SAMPLED_FRAMES,
      MIDWAY_SCROLL_PX,
    );
    const end = await endTopOf(page);

    expect(end, 'room to rise, in px').toBeGreaterThan(MIDWAY_SCROLL_PX);
    expect(
      await railOf(page).evaluate(
        (rail) => getComputedStyle(rail).scrollBehavior,
      ),
      'scroll behaviour',
    ).toBe('smooth');
    expect(tops.at(-1), 'settled up').toBeCloseTo(end, 0);
  });

  test('shows frames on the way up', async ({ page }, testInfo) => {
    skipOffPortrait(testInfo);
    testInfo.skip(
      testInfo.project.name.endsWith('-webkit'),
      'headless WebKit may settle a smooth scroll in one frame',
    );
    await openGlass(page, '/projets');
    const tops = await railTopsAfterMidwayScroll(
      page,
      SAMPLED_FRAMES,
      MIDWAY_SCROLL_PX,
    );
    const end = await endTopOf(page);

    expect(
      tops.filter((top) => isBetween(top, MIDWAY_SCROLL_PX, end)).length,
      'frames on the way up',
    ).toBeGreaterThan(0);
  });
});
