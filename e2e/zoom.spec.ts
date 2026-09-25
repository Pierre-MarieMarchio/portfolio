import type { Page, TestInfo } from '@playwright/test';
import { expect, openHydrated, sizeOf, test } from './site.fixture';

type Point = { readonly x: number; readonly y: number };
type Hole = Point & { readonly radius: number };

const ZOOM_SIZES = new Set(['phone', 'phone-xs', 'phone-landscape', 'tablet']);
const DESKTOP_SIZES = new Set(['desktop', 'desktop-tight']);
const SKY = 'app-space-scene canvas.sky, button.void, section.scene';
const FINGER_SPREAD_PX = 16;
const PINCH_STEPS = 8;
const MIN_CLOSER = 1.8;
const MAX_CLOSER = 3.05;
const MAX_DRIFT_SHARE = 0.03;
const BACK_WITHIN_SHARE = 0.02;
const SETTLE_TIMEOUT_MS = 15_000;
const SETTLE_INTERVAL_MS = 300;

const skipOffTouch = (testInfo: TestInfo): void => {
  testInfo.skip(!ZOOM_SIZES.has(sizeOf(testInfo)), 'the touch formats');
};

const holeOf = (page: Page): Promise<Hole> =>
  page.locator('app-space-scene .stage').evaluate((stage) => ({
    x: Number(stage.dataset['holeX']),
    y: Number(stage.dataset['holeY']),
    radius: Number(stage.dataset['holeRadius']),
  }));

const settledHole = async (page: Page): Promise<Hole> => {
  let last = '';
  await expect
    .poll(
      async () => {
        const hole = await holeOf(page);
        const now = `${String(hole.x)},${String(hole.y)},${String(hole.radius)}`;
        const isSame = hole.radius > 0 && now === last;
        last = now;
        return isSame;
      },
      {
        message: 'the hole settled',
        timeout: SETTLE_TIMEOUT_MS,
        intervals: [SETTLE_INTERVAL_MS],
      },
    )
    .toBe(true);
  return holeOf(page);
};

const openSettled = async (page: Page, path: string): Promise<Hole> => {
  await openHydrated(page, path);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  return settledHole(page);
};

const skyNear = async (
  page: Page,
  hole: Hole,
  spread = FINGER_SPREAD_PX,
): Promise<Point> => {
  const centre = await page.evaluate(
    ({ hole, spread, sky }) => {
      const isSky = (x: number, y: number): boolean =>
        x > 0 &&
        y > 0 &&
        x < innerWidth &&
        y < innerHeight &&
        document.elementFromPoint(x, y)?.matches(sky) === true;
      for (const reach of [2, 3, 1.5, 4, 5]) {
        for (let k = 0; k < 16; k++) {
          const angle = (k * Math.PI) / 8;
          const x = hole.x + Math.cos(angle) * reach * hole.radius;
          const y = hole.y + Math.sin(angle) * reach * hole.radius;
          if (isSky(x, y) && isSky(x - spread, y) && isSky(x + spread, y)) {
            return { x, y };
          }
        }
      }
      return null;
    },
    { hole, spread, sky: SKY },
  );
  if (!centre) {
    throw new Error('no free sky around the hole');
  }
  return centre;
};

const pinchBetween = (
  page: Page,
  starts: readonly [Point, Point],
  ratio: number,
): Promise<void> =>
  page.evaluate(
    ({ starts, ratio, steps }) => {
      const centre = {
        x: (starts[0].x + starts[1].x) / 2,
        y: (starts[0].y + starts[1].y) / 2,
      };
      const fingers = starts.map((start, index) => {
        const target = document.elementFromPoint(start.x, start.y);
        if (!target) {
          throw new Error('nothing under the finger');
        }
        return { id: 11 + index, start, target };
      });
      const send = (
        finger: (typeof fingers)[number],
        type: string,
        spread: number,
      ): void => {
        finger.target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: finger.id,
            pointerType: 'touch',
            isPrimary: finger.id === 11,
            button: type === 'pointermove' ? -1 : 0,
            buttons: type === 'pointerup' || type === 'click' ? 0 : 1,
            clientX: centre.x + (finger.start.x - centre.x) * spread,
            clientY: centre.y + (finger.start.y - centre.y) * spread,
          }),
        );
      };
      for (const finger of fingers) {
        send(finger, 'pointerdown', 1);
      }
      for (let k = 1; k <= steps; k++) {
        for (const finger of fingers) {
          send(finger, 'pointermove', 1 + ((ratio - 1) * k) / steps);
        }
      }
      for (const finger of fingers) {
        send(finger, 'pointerup', ratio);
      }
      const first = fingers[0];
      if (first) {
        send(first, 'click', ratio);
      }
    },
    { starts, ratio, steps: PINCH_STEPS },
  );

const pinch = (page: Page, centre: Point, ratio: number): Promise<void> =>
  pinchBetween(
    page,
    [
      { x: centre.x - FINGER_SPREAD_PX, y: centre.y },
      { x: centre.x + FINGER_SPREAD_PX, y: centre.y },
    ],
    ratio,
  );

const BESIDE_A_PLANET = [30, -30, 40, -40, 50, -50].flatMap((dx) =>
  [0, 20, -20].map((dy) => [dx, dy] as const),
);

const planetAndSky = async (page: Page): Promise<[Point, Point]> => {
  const fingers = await page.evaluate(
    ({ sky, beside }) => {
      for (const button of document.querySelectorAll(
        'app-planet-buttons button',
      )) {
        const box = button.getBoundingClientRect();
        const planet = {
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
        };
        const free = beside
          .map(([dx, dy]) => ({ x: planet.x + dx, y: planet.y + dy }))
          .find((point) =>
            document.elementFromPoint(point.x, point.y)?.matches(sky),
          );
        if (document.elementFromPoint(planet.x, planet.y) === button && free) {
          return [planet, free] as const;
        }
      }
      return null;
    },
    { sky: SKY, beside: BESIDE_A_PLANET },
  );
  if (!fingers) {
    throw new Error('no planet with free sky beside it');
  }
  return [fingers[0], fingers[1]];
};

const doubleTap = (page: Page, at: Point): Promise<void> =>
  page.evaluate(
    ({ at, sky }) => {
      const target = document.elementFromPoint(at.x, at.y);
      if (!target?.matches(sky)) {
        throw new Error('the tap is not on the sky');
      }
      const send = (type: string): void => {
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 21,
            pointerType: 'touch',
            isPrimary: true,
            button: 0,
            buttons: type === 'pointerdown' ? 1 : 0,
            clientX: at.x,
            clientY: at.y,
          }),
        );
      };
      for (let tap = 0; tap < 2; tap++) {
        send('pointerdown');
        send('pointerup');
        send('click');
      }
    },
    { at, sky: SKY },
  );

const driftOf = (before: Hole, after: Hole, centre: Point): number => {
  const scale = after.radius / before.radius;
  return Math.hypot(
    after.x + (centre.x - before.x) * scale - centre.x,
    after.y + (centre.y - before.y) * scale - centre.y,
  );
};

const navLink = (page: Page, name: string) =>
  page.locator('app-main-nav').getByRole('link', { name, exact: true });

test('brings the object closer under two spreading fingers, about them, up to three times', async ({
  page,
}, testInfo) => {
  skipOffTouch(testInfo);
  const before = await openSettled(page, '/');
  const width = page.viewportSize()?.width ?? 0;
  const centre = await skyNear(page, before);

  await pinch(page, centre, 2);
  const closer = await settledHole(page);

  expect(closer.radius / before.radius, 'closer').toBeGreaterThanOrEqual(
    MIN_CLOSER,
  );
  expect(driftOf(before, closer, centre), 'drift, in px').toBeLessThan(
    MAX_DRIFT_SHARE * width,
  );

  await pinch(page, await skyNear(page, closer), 3);
  const clamped = await settledHole(page);

  expect(clamped.radius / before.radius, 'clamped').toBeLessThanOrEqual(
    MAX_CLOSER,
  );
  expect(clamped.radius / before.radius, 'clamped').toBeGreaterThan(MIN_CLOSER);
});

const PLANET_PINCH_SIZES = new Set(['phone', 'phone-xs']);

test('pinches with one finger on a planet and one on the sky, and opens nothing', async ({
  page,
}, testInfo) => {
  testInfo.skip(
    !PLANET_PINCH_SIZES.has(sizeOf(testInfo)),
    'the upright phones',
  );
  const before = await openSettled(page, '/');
  const url = page.url();
  await expect
    .poll(() => page.locator('app-planet-buttons button').count(), 'planets')
    .toBeGreaterThan(0);

  await pinchBetween(page, await planetAndSky(page), 2);
  const closer = await settledHole(page);

  expect(closer.radius / before.radius, 'closer').toBeGreaterThanOrEqual(
    MIN_CLOSER,
  );
  expect(page.url(), 'the address').toBe(url);
  await expect(page.locator('app-project-preview'), 'no preview').toHaveCount(
    0,
  );
});

test('looks closer from the sky above a sheet, and leaves the sheet open', async ({
  page,
}, testInfo) => {
  skipOffTouch(testInfo);
  const before = await openSettled(page, '/projet/bkone');
  const url = page.url();
  const sheet = page.locator('app-project-detail section.window');
  await expect(sheet, 'the sheet').toBeVisible();
  const centre = await skyNear(page, before);

  await pinch(page, centre, 2);
  const closer = await settledHole(page);

  expect(closer.radius / before.radius, 'closer').toBeGreaterThanOrEqual(
    MIN_CLOSER,
  );
  expect(page.url(), 'the address').toBe(url);
  await expect(sheet, 'the sheet, still open').toBeVisible();
});

test('looks closer on a double tap on the home sky, and back on a second', async ({
  page,
}, testInfo) => {
  skipOffTouch(testInfo);
  const before = await openSettled(page, '/');

  await doubleTap(page, await skyNear(page, before, 0));
  const closer = await settledHole(page);
  expect(closer.radius / before.radius, 'closer').toBeGreaterThanOrEqual(
    MIN_CLOSER,
  );

  await doubleTap(page, await skyNear(page, closer, 0));
  const back = await settledHole(page);
  expect(
    Math.abs(back.radius - before.radius) / before.radius,
    'back',
  ).toBeLessThanOrEqual(BACK_WITHIN_SHARE);
});

test('comes back to the framing of the next view after a close look', async ({
  page,
}, testInfo) => {
  skipOffTouch(testInfo);
  await openSettled(page, '/');
  await navLink(page, 'Projets').tap();
  await expect(page).toHaveURL(/\/projets$/);
  const overview = await settledHole(page);
  await navLink(page, 'Accueil').tap();
  await expect(page).toHaveURL(/\/$/);
  const home = await settledHole(page);

  await doubleTap(page, await skyNear(page, home, 0));
  const closer = await settledHole(page);
  expect(closer.radius / home.radius, 'closer').toBeGreaterThanOrEqual(
    MIN_CLOSER,
  );

  await navLink(page, 'Projets').tap();
  await expect(page).toHaveURL(/\/projets$/);
  const next = await settledHole(page);
  expect(
    Math.abs(next.radius - overview.radius) / overview.radius,
    'the overview radius',
  ).toBeLessThanOrEqual(BACK_WITHIN_SHARE);
});

const touchActionUnder = async (page: Page, path: string): Promise<string> => {
  const hole = await openSettled(page, path);
  const centre = await skyNear(page, hole);
  return page.evaluate((at) => {
    const hit = document.elementFromPoint(at.x, at.y);
    return hit ? getComputedStyle(hit).touchAction : '';
  }, centre);
};

for (const path of ['/', '/projet/bkone']) {
  test(`keeps the page from zooming under the fingers on the sky, ${path}`, async ({
    page,
  }, testInfo) => {
    skipOffTouch(testInfo);
    expect(await touchActionUnder(page, path)).toBe('none');
  });

  test(`leaves the touch gestures of the desktop as they were, ${path}`, async ({
    page,
  }, testInfo) => {
    testInfo.skip(!DESKTOP_SIZES.has(sizeOf(testInfo)), 'the desktop');
    expect(await touchActionUnder(page, path)).toBe('auto');
  });
}
