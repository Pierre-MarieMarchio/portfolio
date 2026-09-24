import type { Locator, Page, TestInfo } from '@playwright/test';
import { SITE_ROUTES, type SiteRoute } from './site-routes';
import { expect, openHydrated, sizeOf, test } from './site.fixture';

type Point = { readonly x: number; readonly y: number };
type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

const TABLET_SIZES = new Set(['tablet', 'tablet-landscape']);
const TOUCH_MOVE_STEPS = 8;
const MIN_FRAME_ON_SCREEN_PX = 150;
const PORTRAIT = { width: 820, height: 1180 };

const firstWindow = (page: Page): Locator =>
  page.locator('section.window').first();

const boxOf = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('expected a box on screen');
  }
  return box;
};

const centreOf = (box: Box): Point => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

const stepsBetween = (from: Point, to: Point): Point[] =>
  Array.from({ length: TOUCH_MOVE_STEPS }, (_, index) => {
    const share = (index + 1) / TOUCH_MOVE_STEPS;
    return {
      x: from.x + (to.x - from.x) * share,
      y: from.y + (to.y - from.y) * share,
    };
  });

const dragByDevToolsTouch = async (
  page: Page,
  from: Point,
  to: Point,
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
  await touch('touchStart', [from]);
  for (const step of stepsBetween(from, to)) {
    await touch('touchMove', [step]);
  }
  await touch('touchEnd', []);
  await session.detach();
};

const dragByTouchPointerEvents = (
  page: Page,
  from: Point,
  to: Point,
): Promise<void> =>
  page.evaluate(
    ({ start, steps }) => {
      const target = document.elementFromPoint(start.x, start.y);
      if (!target) {
        throw new Error('nothing under the finger');
      }
      const send = (type: string, at: { x: number; y: number }): void => {
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 2,
            pointerType: 'touch',
            isPrimary: true,
            button: type === 'pointermove' ? -1 : 0,
            buttons: type === 'pointerup' ? 0 : 1,
            clientX: at.x,
            clientY: at.y,
          }),
        );
      };
      send('pointerdown', start);
      for (const step of steps) {
        send('pointermove', step);
      }
      send('pointerup', steps.at(-1) ?? start);
    },
    { start: from, steps: stepsBetween(from, to) },
  );

const dragByTouch = (
  page: Page,
  browserName: string,
  from: Point,
  to: Point,
): Promise<void> =>
  browserName === 'chromium'
    ? dragByDevToolsTouch(page, from, to)
    : dragByTouchPointerEvents(page, from, to);

const doubleTap = async (page: Page, at: Point): Promise<void> => {
  await page.touchscreen.tap(at.x, at.y);
  await page.touchscreen.tap(at.x, at.y);
};

const openWindowOf = async (page: Page, route: SiteRoute): Promise<void> => {
  await openHydrated(page, route.path);
  if (route.name.endsWith('-home')) {
    await page.locator('app-featured-bar button').first().tap();
    await expect(
      page.locator('app-project-preview'),
      'the preview',
    ).toHaveCount(1);
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};

type Edges = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

type Layout = {
  readonly screen: Edges;
  readonly pageBar: Edges | null;
  readonly windows: readonly (Edges & { readonly name: string })[];
};

const edgesOf = async (locator: Locator): Promise<Edges> => {
  const box = await boxOf(locator);
  return {
    left: box.x,
    top: box.y,
    right: box.x + box.width,
    bottom: box.y + box.height,
  };
};

const layoutOf = async (page: Page): Promise<Layout> => {
  const size = page.viewportSize();
  if (!size) {
    throw new Error('expected a viewport');
  }
  const pageBar = page.locator('.bar');
  const windows = await page.locator('section.window').all();
  return {
    screen: { left: 0, top: 0, right: size.width, bottom: size.height },
    pageBar: (await pageBar.count()) > 0 ? await edgesOf(pageBar) : null,
    windows: await Promise.all(
      windows.map(async (window) => ({
        name: (await window.getAttribute('aria-label')) ?? '',
        ...(await edgesOf(window)),
      })),
    ),
  };
};

const isOverlapping = (a: Edges, b: Edges): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const overflowsOf = ({ screen, pageBar, windows }: Layout): string[] =>
  windows.flatMap((box) =>
    [
      box.left < screen.left ? 'left' : '',
      box.top < screen.top ? 'top' : '',
      box.right > screen.right ? 'right' : '',
      box.bottom > screen.bottom ? 'bottom' : '',
      pageBar && isOverlapping(box, pageBar) ? 'page bar' : '',
    ]
      .filter(Boolean)
      .map((fault) => `${box.name}: ${fault}`),
  );

const hoverRulesInForce = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    type HoverRule = {
      readonly selector: string;
      readonly media: readonly string[];
    };
    const hoverRulesIn = (
      rules: CSSRuleList,
      media: readonly string[],
    ): HoverRule[] =>
      [...rules].flatMap((rule) => {
        if (rule instanceof CSSMediaRule) {
          return hoverRulesIn(rule.cssRules, [...media, rule.media.mediaText]);
        }
        const own =
          rule instanceof CSSStyleRule && rule.selectorText.includes(':hover')
            ? [{ selector: rule.selectorText, media }]
            : [];
        const nested =
          rule instanceof CSSGroupingRule
            ? hoverRulesIn(rule.cssRules, media)
            : [];
        return [...own, ...nested];
      });
    return [...document.styleSheets]
      .flatMap((sheet) => hoverRulesIn(sheet.cssRules, []))
      .filter((rule) => rule.media.every((text) => matchMedia(text).matches))
      .map((rule) => rule.selector);
  });

const skipOffTablet = (testInfo: TestInfo): void => {
  testInfo.skip(!TABLET_SIZES.has(sizeOf(testInfo)), 'the tablet, by touch');
};

test('moves a window by its title bar under the finger', async ({
  page,
  browserName,
}, testInfo) => {
  skipOffTablet(testInfo);
  await openHydrated(page, '/projets');
  const before = await boxOf(firstWindow(page));
  const grip = centreOf(await boxOf(firstWindow(page).locator('.titlebar h2')));

  await dragByTouch(page, browserName, grip, {
    x: grip.x - 200,
    y: grip.y + 120,
  });

  const after = await boxOf(firstWindow(page));
  expect(after.x - before.x, 'sideways').toBeCloseTo(-200, 0);
  expect(after.y - before.y, 'downwards').toBeCloseTo(120, 0);
});

test('folds a window on a double tap of its title bar, and unfolds it', async ({
  page,
}, testInfo) => {
  skipOffTablet(testInfo);
  await openHydrated(page, '/projets');
  const window = firstWindow(page);
  const fold = window.locator('.titlebar button[aria-expanded]');
  const grip = centreOf(await boxOf(window.locator('.titlebar h2')));

  await doubleTap(page, grip);
  await expect(fold, 'folded').toHaveAttribute('aria-expanded', 'false');
  await expect(window.locator('.body'), 'no body').toHaveCount(0);

  await doubleTap(page, grip);
  await expect(fold, 'unfolded').toHaveAttribute('aria-expanded', 'true');
});

test('keeps a moved window on screen after a turn to portrait', async ({
  page,
  browserName,
}, testInfo) => {
  testInfo.skip(sizeOf(testInfo) !== 'tablet-landscape', 'from landscape');
  await openHydrated(page, '/projets');
  const window = firstWindow(page);
  const grip = centreOf(await boxOf(window.locator('.titlebar h2')));
  await dragByTouch(page, browserName, grip, { x: grip.x + 2000, y: grip.y });

  await page.setViewportSize(PORTRAIT);

  await expect
    .poll(async () => {
      const box = await boxOf(window);
      return Math.min(box.x + box.width, PORTRAIT.width) - Math.max(box.x, 0);
    }, 'window frame on screen, in px')
    .toBeGreaterThanOrEqual(MIN_FRAME_ON_SCREEN_PX);
  const box = await boxOf(window.locator('.titlebar'));
  expect(box.y, 'title bar below the top').toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, 'title bar above the bottom').toBeLessThanOrEqual(
    PORTRAIT.height,
  );
});

test('applies no hover style', async ({ page }, testInfo) => {
  skipOffTablet(testInfo);
  await openHydrated(page, '/projets');

  expect(await hoverRulesInForce(page)).toEqual([]);
});

for (const route of SITE_ROUTES) {
  test(`fits the open window on screen, below the page bar, ${route.name}`, async ({
    page,
  }, testInfo) => {
    skipOffTablet(testInfo);
    await openWindowOf(page, route);

    await expect(firstWindow(page), 'a window').toBeVisible();
    await expect
      .poll(async () => overflowsOf(await layoutOf(page)))
      .toEqual([]);
  });
}
