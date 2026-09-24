import { fileURLToPath } from 'node:url';
import { SITE_ROUTES } from './site-routes';
import { expect, test } from './site.fixture';

const CAPTURE_STYLE = fileURLToPath(new URL('capture.css', import.meta.url));

for (const route of SITE_ROUTES) {
  test(`${route.name} (${route.path})`, async ({
    page,
    consoleMessages,
    captures,
  }) => {
    await page.goto(route.path);
    await expect(page.locator('[ngh]'), 'hydrated').toHaveCount(0);
    await expect(page.locator('h1'), 'one heading').toHaveCount(1);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const width = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect
      .soft(width.scroll, 'no horizontal scroll')
      .toBeLessThanOrEqual(width.client);

    if (captures) {
      await expect
        .soft(page)
        .toHaveScreenshot(`${route.name}.png`, { stylePath: CAPTURE_STYLE });
    }

    expect(consoleMessages, 'console errors and warnings').toEqual([]);
  });
}
