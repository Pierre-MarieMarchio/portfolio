import type { Page } from '@playwright/test';
import { SITE_ROUTES } from './site-routes';
import { expect, openHydrated, sizeOf, test } from './site.fixture';

type DisplayFormat = 'phone' | 'tablet' | 'desktop';

const FORMAT_AT: Readonly<Record<string, DisplayFormat>> = {
  'phone-xs': 'phone',
  'phone-s': 'phone',
  phone: 'phone',
  'phone-landscape': 'phone',
  tablet: 'tablet',
  'tablet-landscape': 'tablet',
  'desktop-tight': 'desktop',
  desktop: 'desktop',
};

const TOUCH_TARGET_SIZES = new Set(['phone', 'tablet']);
const MIN_TARGET_PX = 44;

const displayFormat = (page: Page) =>
  expect(page.locator('html'), 'display format');

const undersizedTargets = (page: Page, minPx: number): Promise<string[]> =>
  page.evaluate((min) => {
    const isShown = (element: HTMLElement): boolean =>
      element.checkVisibility({
        visibilityProperty: true,
        opacityProperty: true,
      }) && element.closest('.visually-hidden, .landing') === null;
    return [
      ...document.querySelectorAll<HTMLElement>('button, a, [role="tab"]'),
    ]
      .filter((element) => isShown(element))
      .map((element) => ({ element, box: element.getBoundingClientRect() }))
      .filter(({ box }) => box.width < min || box.height < min)
      .map(({ element, box }) => {
        const name = (element.getAttribute('aria-label') ?? element.textContent)
          .trim()
          .slice(0, 40);
        return `${element.tagName.toLowerCase()} "${name}" ${box.width.toFixed(0)}×${box.height.toFixed(0)}`;
      });
  }, minPx);

test('tells its display format on the root element', async ({
  page,
}, testInfo) => {
  const expected = FORMAT_AT[sizeOf(testInfo)];
  expect(expected, 'a format for this size').toBeDefined();

  await openHydrated(page, '/');

  await displayFormat(page).toHaveAttribute('data-format', expected ?? '');
});

test('follows a rotation without reloading', async ({ page }, testInfo) => {
  testInfo.skip(sizeOf(testInfo) !== 'phone', 'one touch page per engine');
  const navigations: string[] = [];
  await openHydrated(page, '/');
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      navigations.push(frame.url());
    }
  });
  await page.evaluate(() => {
    Object.assign(window, { e2eSamePage: true });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await displayFormat(page).toHaveAttribute('data-format', 'phone');
  await page.setViewportSize({ width: 844, height: 390 });
  await displayFormat(page).toHaveAttribute('data-format', 'phone');
  await page.setViewportSize({ width: 820, height: 1180 });
  await displayFormat(page).toHaveAttribute('data-format', 'tablet');

  expect(navigations, 'no navigation').toEqual([]);
  expect(
    await page.evaluate(() => 'e2eSamePage' in window),
    'same document',
  ).toBe(true);
});

test('leaves no marker hovered after a touch on it and one elsewhere', async ({
  page,
}, testInfo) => {
  testInfo.skip(sizeOf(testInfo) !== 'phone', 'the touch rule, at phone');
  const bar = page.locator('app-featured-bar');
  const lit = bar.locator('button[data-lit="true"]');
  await openHydrated(page, '/');
  await expect(lit, 'at rest before the touch').toHaveCount(0);
  await page.evaluate(() => {
    const litMarkers: string[] = [];
    Object.assign(window, { e2eLitMarkers: litMarkers });
    new MutationObserver((records) => {
      for (const record of records) {
        if (
          record.target instanceof HTMLElement &&
          record.target.dataset['lit'] === 'true'
        ) {
          litMarkers.push(record.target.getAttribute('aria-label') ?? '');
        }
      }
    }).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-lit'],
    });
  });

  await bar.locator('button').nth(1).tap();
  await expect(page.locator('app-project-preview'), 'the preview').toHaveCount(
    1,
  );
  await page.touchscreen.tap(8, (page.viewportSize()?.height ?? 0) / 2);

  await expect(page.locator('app-project-preview'), 'no preview').toHaveCount(
    0,
  );
  await expect(bar, 'the rule is back').toBeVisible();
  await expect(lit, 'no marker hovered').toHaveCount(0);
  expect(
    await page.evaluate(() =>
      'e2eLitMarkers' in window ? window.e2eLitMarkers : null,
    ),
    'no marker lit by the touches',
  ).toEqual([]);
});

for (const route of SITE_ROUTES) {
  test(`gives every target ${String(MIN_TARGET_PX)} px at the touch, ${route.name}`, async ({
    page,
  }, testInfo) => {
    testInfo.skip(
      !TOUCH_TARGET_SIZES.has(sizeOf(testInfo)),
      'measured at phone and tablet',
    );
    await openHydrated(page, route.path);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    expect(await undersizedTargets(page, MIN_TARGET_PX)).toEqual([]);
  });
}
