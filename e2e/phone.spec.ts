import type { Locator, Page, TestInfo } from '@playwright/test';
import { SITE_ROUTES } from './site-routes';
import { expect, openHydrated, sizeOf, test } from './site.fixture';

type Edges = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

const PORTRAIT_SIZES = new Set(['phone-xs', 'phone-s', 'phone']);
const PHONE_SIZES = new Set([...PORTRAIT_SIZES, 'phone-landscape']);
const EDGE_TOLERANCE_PX = 1;
const MIN_TARGET_PX = 44;
const EDGE_WITHIN_PX = 12;
const MAX_CHROME_SHARE = 0.12;
const MAX_TAPS_TO_A_CONTACT = 2;

const CONTACT_NAMES = {
  fr: [
    'M’écrire à pierremariemarchio.pro@gmail.com',
    'Profil LinkedIn de Pierre-Marie Marchio',
    'Dépôts GitHub de Pierre-Marie Marchio',
    'Ouvrir mon CV en PDF',
  ],
  en: [
    'Write to me at pierremariemarchio.pro@gmail.com',
    'LinkedIn profile of Pierre-Marie Marchio',
    'GitHub repositories of Pierre-Marie Marchio',
    'Open my CV as a PDF',
  ],
} as const;

const GLASS_PAGES = [
  { name: 'index', path: '/projets' },
  { name: 'sheet', path: '/projet/bkone' },
  { name: 'about', path: '/a-propos' },
  { name: 'preview', path: '/' },
] as const;

const skipOffPhone = (testInfo: TestInfo): void => {
  testInfo.skip(!PHONE_SIZES.has(sizeOf(testInfo)), 'the phone');
};

const skipOffPortrait = (testInfo: TestInfo): void => {
  testInfo.skip(!PORTRAIT_SIZES.has(sizeOf(testInfo)), 'the phone, upright');
};

const isPortrait = (testInfo: TestInfo): boolean =>
  PORTRAIT_SIZES.has(sizeOf(testInfo));

const edgesOf = async (locator: Locator): Promise<Edges> => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('expected a box on screen');
  }
  return {
    left: box.x,
    top: box.y,
    right: box.x + box.width,
    bottom: box.y + box.height,
  };
};

const areaOf = (edges: Edges): number =>
  Math.max(0, edges.right - edges.left) * Math.max(0, edges.bottom - edges.top);

const isOverlapping = (a: Edges, b: Edges): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const isOnScreen = (page: Page, edges: Edges): boolean => {
  const size = page.viewportSize();
  return (
    size !== null &&
    edges.left >= -EDGE_TOLERANCE_PX &&
    edges.top >= -EDGE_TOLERANCE_PX &&
    edges.right <= size.width + EDGE_TOLERANCE_PX &&
    edges.bottom <= size.height + EDGE_TOLERANCE_PX
  );
};

const pageBarOf = (page: Page): Locator => page.locator('.bar');
const contentEdgesOf = (bar: Locator): Promise<Edges> =>
  bar.evaluate((element) => {
    const boxes = [...element.children]
      .flatMap((child) => [child, ...child.children])
      .map((child) => child.getBoundingClientRect())
      .filter((box) => box.width > 0 && box.height > 0);
    return {
      left: Math.min(...boxes.map((box) => box.left)),
      top: Math.min(...boxes.map((box) => box.top)),
      right: Math.max(...boxes.map((box) => box.right)),
      bottom: Math.max(...boxes.map((box) => box.bottom)),
    };
  });
const contactToggleOf = (page: Page): Locator =>
  page.locator('app-social-links').getByRole('button', {
    name: /^(Me contacter|Contact me)$/,
  });
const dockOf = (page: Page): Locator =>
  page.locator('app-observatory-dock nav');
const openWindowOf = (page: Page): Locator =>
  page.locator('section.window:visible');

const settle = (page: Page): Promise<void> =>
  page.evaluate(async () => {
    await document.fonts.ready;
  });

const openPreview = async (page: Page): Promise<void> => {
  await page.locator('app-featured-bar button').first().tap();
  await expect(openWindowOf(page), 'the preview').toHaveAttribute(
    'aria-label',
    'Aperçu du projet',
  );
};

const openGlassPage = async (
  page: Page,
  { name, path }: (typeof GLASS_PAGES)[number],
): Promise<void> => {
  await openHydrated(page, path);
  await settle(page);
  if (name === 'preview') {
    await openPreview(page);
  }
  await expect(openWindowOf(page), 'one open glass').toHaveCount(1);
};

const unreachableTitlebarButtons = (page: Page): Promise<string[]> =>
  openWindowOf(page).evaluate((window) =>
    [...window.querySelectorAll<HTMLElement>('.titlebar button')]
      .filter((button) => {
        const box = button.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return hit === null || !button.contains(hit);
      })
      .map((button) => button.getAttribute('aria-label') ?? ''),
  );

const raiseGlass = async (page: Page): Promise<void> => {
  await page
    .locator('.glass--rising .rail')
    .first()
    .evaluate((rail) => {
      rail.scrollTo({ top: rail.scrollHeight, behavior: 'instant' });
    });
  const size = page.viewportSize();
  await expect
    .poll(async () => (await edgesOf(openWindowOf(page))).top, 'raised')
    .toBeLessThan((size?.height ?? 0) / 2);
};

const foldGlass = async (page: Page): Promise<void> => {
  const fold = openWindowOf(page).locator('.titlebar button[aria-expanded]');
  await fold.tap();
  await expect(fold, 'folded').toHaveAttribute('aria-expanded', 'false');
};

const expectNothingOverTheGlass = async (
  page: Page,
  state: string,
): Promise<void> => {
  await expect
    .poll(() => unreachableTitlebarButtons(page), `buttons covered, ${state}`)
    .toEqual([]);
};

test('lays the home page out without overlaps, all on screen', async ({
  page,
}, testInfo) => {
  skipOffPhone(testInfo);
  await openHydrated(page, '/');
  await settle(page);
  await expect(contactToggleOf(page), 'revealed').toBeVisible();
  const parts = {
    'page bar': await contentEdgesOf(pageBarOf(page)),
    title: await edgesOf(page.locator('app-home-title')),
    rule: await edgesOf(page.locator('app-featured-bar')),
    contacts: await edgesOf(contactToggleOf(page)),
  };
  await contactToggleOf(page).tap();
  await expect(contactToggleOf(page), 'open').toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const opened = {
    ...parts,
    'open contacts': await edgesOf(
      page.locator('app-social-links ul').locator('..'),
    ),
  };

  const entries = Object.entries(opened);
  const overlaps = entries.flatMap(([name, edges], index) =>
    entries
      .slice(index + 1)
      .filter(
        ([other, otherEdges]) =>
          !(name === 'contacts' && other === 'open contacts') &&
          !(name === 'page bar' && other === 'open contacts') &&
          isOverlapping(edges, otherEdges),
      )
      .map(([other]) => `${name} over ${other}`),
  );
  const offScreen = entries
    .filter(([, edges]) => !isOnScreen(page, edges))
    .map(([name]) => name);

  expect(overlaps, 'overlaps').toEqual([]);
  expect(offScreen, 'off screen').toEqual([]);
});

test('keeps the page bar on one line', async ({ page }, testInfo) => {
  skipOffPhone(testInfo);
  await openHydrated(page, '/projets');
  await settle(page);

  const lines = await pageBarOf(page).evaluate((bar) => {
    const centres = [...bar.querySelectorAll('a, [aria-current]')]
      .map((element) => element.getBoundingClientRect())
      .filter((box) => box.width > 0)
      .map((box) => Math.round(box.top + box.height / 2));
    return {
      rows: new Set(centres).size,
      overflow: bar.scrollWidth - bar.clientWidth,
    };
  });

  expect(lines.rows, 'rows of the page bar').toBe(1);
  expect(lines.overflow, 'nothing cut off').toBeLessThanOrEqual(0);
});

const SMALL_LANDSCAPE = { width: 568, height: 320 } as const;

const fitSmallLandscape = async (
  page: Page,
  testInfo: TestInfo,
): Promise<void> => {
  if (!isPortrait(testInfo)) {
    await page.setViewportSize(SMALL_LANDSCAPE);
  }
};

const OTHER_LANGUAGE_NAME = 'English';

const barLinesOf = (bar: Locator) =>
  bar.evaluate((element) => {
    const style = getComputedStyle(element);
    const centres = [...element.querySelectorAll('a')]
      .map((link) => link.getBoundingClientRect())
      .filter((box) => box.width > 0)
      .map((box) => Math.round(box.top + box.height / 2));
    return {
      border: [
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ],
      background: style.backgroundColor,
      rows: new Set(centres).size,
      overflow: element.scrollWidth - element.clientWidth,
    };
  });

test('draws the page bar flat, on one line, the other language included', async ({
  page,
}, testInfo) => {
  skipOffPhone(testInfo);
  await fitSmallLandscape(page, testInfo);
  await openHydrated(page, '/projets');
  await settle(page);
  const bar = pageBarOf(page);
  const other = bar.getByRole('link', {
    name: OTHER_LANGUAGE_NAME,
    exact: true,
  });

  await expect(other, 'the other language').toBeVisible();
  await expect(other).toHaveText('EN');
  const lines = await barLinesOf(bar);
  const otherEdges = await edgesOf(other);

  expect(lines.border, 'no border').toEqual(['0px', '0px', '0px', '0px']);
  expect(lines.background, 'no box background').toBe('rgba(0, 0, 0, 0)');
  expect(lines.rows, 'rows of the page bar').toBe(1);
  expect(lines.overflow, 'nothing cut off').toBeLessThanOrEqual(0);
  expect(isOnScreen(page, otherEdges), 'the other language on screen').toBe(
    true,
  );
  expect(
    otherEdges.right - otherEdges.left,
    'the other language, wide enough to tap',
  ).toBeGreaterThanOrEqual(MIN_TARGET_PX);
});

const openContactsOf = (page: Page): Locator =>
  page.locator('app-social-links ul').locator('..');

const expectContactsClearOfTheGlass = async (
  page: Page,
  state: string,
): Promise<void> => {
  const contacts = await edgesOf(openContactsOf(page));
  const glass = await edgesOf(openWindowOf(page));
  expect(
    isOverlapping(contacts, glass),
    `contacts over the glass, ${state}`,
  ).toBe(false);
  await expectNothingOverTheGlass(page, state);
};

test('puts the contacts at the right of the top band, clear of the glass', async ({
  page,
}, testInfo) => {
  skipOffPortrait(testInfo);
  await openGlassPage(page, GLASS_PAGES[0]);
  const size = page.viewportSize();
  const bar = await edgesOf(pageBarOf(page));
  const toggle = await edgesOf(contactToggleOf(page));

  expect(toggle.top, 'in the top band').toBeGreaterThanOrEqual(bar.top);
  expect(toggle.bottom, 'in the top band').toBeLessThanOrEqual(bar.bottom);
  expect(
    (size?.width ?? 0) - toggle.right,
    'at the right end',
  ).toBeLessThanOrEqual(EDGE_WITHIN_PX);
  expect(
    isOverlapping(toggle, await contentEdgesOf(pageBarOf(page))),
    'beside the language and the navigation',
  ).toBe(false);
  expect(
    await contactToggleOf(page).evaluate((button) => {
      const style = getComputedStyle(button);
      return [style.borderTopColor, style.backgroundColor];
    }),
    'a flat toggle, closed',
  ).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']);

  await contactToggleOf(page).tap();
  await expect(contactToggleOf(page), 'open').toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const contacts = await edgesOf(openContactsOf(page));
  expect(contacts.right, 'to the left of the toggle').toBeLessThanOrEqual(
    toggle.left,
  );
  expect(contacts.left, 'from the left edge').toBeLessThanOrEqual(
    EDGE_WITHIN_PX,
  );
  expect(contacts.top, 'over the whole row').toBeLessThanOrEqual(
    (await contentEdgesOf(pageBarOf(page))).top,
  );
  expect(contacts.bottom, 'within the top band').toBeLessThanOrEqual(
    (await edgesOf(openWindowOf(page).locator('.titlebar'))).top,
  );
  await expectContactsClearOfTheGlass(page, 'low');

  await raiseGlass(page);
  await expectContactsClearOfTheGlass(page, 'high');
});

test('rests a raised glass on the bottom edge when the dock is empty', async ({
  page,
}, testInfo) => {
  skipOffPhone(testInfo);
  await openGlassPage(page, GLASS_PAGES[0]);
  await expect(dockOf(page).getByRole('link'), 'empty dock').toHaveCount(0);
  if (isPortrait(testInfo)) {
    await raiseGlass(page);
  }
  const height = page.viewportSize()?.height ?? 0;

  await expect
    .poll(
      async () => Math.abs((await edgesOf(openWindowOf(page))).bottom - height),
      'gap between the glass and the bottom edge, in px',
    )
    .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
});

const shownGlassOf = (page: Page): Promise<Edges> =>
  openWindowOf(page).evaluate((window) => {
    const box = window.getBoundingClientRect();
    const clip = window.closest('.rail')?.getBoundingClientRect() ?? box;
    return {
      left: Math.max(box.left, clip.left),
      top: Math.max(box.top, clip.top),
      right: Math.min(box.right, clip.right),
      bottom: Math.min(box.bottom, clip.bottom),
    };
  });

const dockSheetBehindAbout = async (page: Page): Promise<void> => {
  await openHydrated(page, '/projet/bkone');
  await settle(page);
  await openWindowOf(page).locator('.titlebar button.pin').tap();
  await pageBarOf(page).getByRole('link', { name: 'À propos' }).tap();
  await expect(openWindowOf(page)).toHaveAttribute('aria-label', 'À propos');
  await expect(
    dockOf(page).getByRole('link', { name: 'Fiche' }),
    'the docked sheet',
  ).toBeVisible();
};

test('keeps the dock off the body of the open glass', async ({
  page,
}, testInfo) => {
  skipOffPhone(testInfo);
  await dockSheetBehindAbout(page);

  await expect
    .poll(
      async () =>
        isOverlapping(await edgesOf(dockOf(page)), await shownGlassOf(page)),
      'dock over the glass, low',
    )
    .toBe(false);

  if (isPortrait(testInfo)) {
    await raiseGlass(page);
    expect(
      isOverlapping(await edgesOf(dockOf(page)), await shownGlassOf(page)),
      'dock over the glass, high',
    ).toBe(false);
  }
});

for (const isSmall of [false, true]) {
  test(`keeps the chrome off the home title and the featured rule${isSmall ? ', 568×320' : ''}`, async ({
    page,
  }, testInfo) => {
    skipOffPhone(testInfo);
    if (isSmall) {
      testInfo.skip(isPortrait(testInfo), 'the phone, lying down');
      await fitSmallLandscape(page, testInfo);
    }
    await dockSheetBehindAbout(page);
    await pageBarOf(page).getByRole('link', { name: 'Accueil' }).tap();
    await expect(page).toHaveURL(/\/$/);
    const rule = page.locator('app-featured-bar');
    await expect(rule, 'the rule').toBeVisible();
    const parts = {
      dock: await edgesOf(dockOf(page)),
      contacts: await edgesOf(contactToggleOf(page)),
      title: await edgesOf(page.locator('app-home-title')),
      'all projects': await edgesOf(
        rule.getByRole('link', { name: /Tous les projets/ }),
      ),
      rule: await edgesOf(rule),
    };

    const overlaps = (['dock', 'contacts', 'title'] as const).flatMap((name) =>
      (['all projects', 'rule'] as const)
        .filter((other) => isOverlapping(parts[name], parts[other]))
        .map((other) => `${name} over ${other}`),
    );
    expect(overlaps, 'overlaps').toEqual([]);
  });
}

for (const path of ['/', '/projets']) {
  test(`fits the page to the screen without a scroll, ${path}`, async ({
    page,
  }, testInfo) => {
    const size = sizeOf(testInfo);
    testInfo.skip(
      size !== 'phone-xs' && size !== 'phone-landscape',
      'the smallest phones',
    );
    await fitSmallLandscape(page, testInfo);
    await openHydrated(page, path);
    await settle(page);
    const height = page.viewportSize()?.height ?? 0;

    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
      'height of the document',
    ).toBe(height);

    if (path !== '/') {
      if (isPortrait(testInfo)) {
        await raiseGlass(page);
      }
      const glass = await edgesOf(openWindowOf(page));
      const footer = await edgesOf(openWindowOf(page).locator('.footer'));
      expect(isOnScreen(page, glass), 'glass on screen').toBe(true);
      expect(isOnScreen(page, footer), 'footer on screen').toBe(true);
    }
  });
}

test('frames the planet of a sheet opened from home above the glass', async ({
  page,
}, testInfo) => {
  skipOffPortrait(testInfo);
  await openHydrated(page, '/');
  await settle(page);
  await openPreview(page);
  const barBottom = (await edgesOf(pageBarOf(page))).bottom;
  const planet = page.locator(
    'app-planet-buttons button[aria-expanded="true"]',
  );
  const previewTop = (await edgesOf(openWindowOf(page))).top;
  await expect
    .poll(async () => {
      const edges = await edgesOf(planet);
      return edges.top >= barBottom && edges.bottom <= previewTop;
    }, 'the planet button between the page bar and the preview')
    .toBe(true);
  const title = await openWindowOf(page).locator('h2').innerText();

  await openWindowOf(page)
    .getByRole('link', { name: /Voir le projet/ })
    .tap();

  await expect(openWindowOf(page), 'the sheet').toHaveAttribute(
    'aria-label',
    'Détail du projet',
  );
  const glassTop = (await edgesOf(openWindowOf(page))).top;
  const name = page
    .locator('app-space-scene .label')
    .filter({ hasText: new RegExp(`^${title}$`, 'i') });
  await expect
    .poll(async () => {
      const edges = await edgesOf(name);
      return edges.top >= barBottom && edges.bottom <= glassTop;
    }, 'the planet between the page bar and the glass')
    .toBe(true);
});

test('keeps one glass open, and docks the pinned sheet', async ({
  page,
}, testInfo) => {
  skipOffPhone(testInfo);
  await openHydrated(page, '/projet/bkone');
  await settle(page);
  await openWindowOf(page).locator('.titlebar button.pin').tap();

  await pageBarOf(page).getByRole('link', { name: 'À propos' }).tap();

  await expect(openWindowOf(page), 'one open glass').toHaveCount(1);
  await expect(openWindowOf(page)).toHaveAttribute('aria-label', 'À propos');
  const entry = dockOf(page).getByRole('link', { name: 'Fiche' });
  await expect(dockOf(page).getByRole('link'), 'one docked').toHaveCount(1);
  await expect(entry, 'the docked sheet').toBeVisible();

  await entry.tap();

  await expect(page).toHaveURL(/\/projet\/bkone$/);
  await expect(openWindowOf(page), 'one open glass').toHaveCount(1);
  await expect(openWindowOf(page)).toHaveAttribute(
    'aria-label',
    'Détail du projet',
  );
});

test('steps back one view on each close: sheet, index, home', async ({
  page,
}, testInfo) => {
  skipOffPhone(testInfo);
  await openHydrated(page, '/projet/bkone');
  const close = (): Locator =>
    openWindowOf(page).getByRole('button', { name: 'Fermer la fenêtre' });

  await close().tap();
  await expect(page).toHaveURL(/\/projets$/);
  await expect(openWindowOf(page)).toHaveAttribute(
    'aria-label',
    'Liste des projets',
  );

  await close().tap();
  await expect(page).toHaveURL(/\/$/);
  await expect(openWindowOf(page), 'no glass').toHaveCount(0);
});

for (const glassPage of GLASS_PAGES) {
  test(`leaves every button of the glass bar in reach, ${glassPage.name}`, async ({
    page,
  }, testInfo) => {
    skipOffPhone(testInfo);
    await openGlassPage(page, glassPage);
    await expectNothingOverTheGlass(page, 'low');

    if (isPortrait(testInfo) && glassPage.name !== 'preview') {
      await raiseGlass(page);
      await expectNothingOverTheGlass(page, 'high');
    }

    await foldGlass(page);
    await expectNothingOverTheGlass(page, 'folded');
  });
}

for (const route of SITE_ROUTES) {
  test(`reaches every contact in two taps, ${route.name}`, async ({
    page,
  }, testInfo) => {
    skipOffPhone(testInfo);
    await openHydrated(page, route.path);
    await settle(page);
    const names = CONTACT_NAMES[route.name.startsWith('en-') ? 'en' : 'fr'];
    let taps = 0;

    const first = page.getByRole('link', { name: names[0], exact: true });
    if (!(await first.isVisible())) {
      await contactToggleOf(page).tap();
      taps += 1;
    }

    for (const name of names) {
      const link = page.getByRole('link', { name, exact: true });
      await expect(link, name).toBeVisible();
      const edges = await edgesOf(link);
      expect(isOnScreen(page, edges), `${name} on screen`).toBe(true);
      const isOnTop = await link.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return hit !== null && element.contains(hit);
      });
      expect(isOnTop, `${name} uncovered`).toBe(true);
    }
    expect(taps + 1, 'taps to a contact').toBeLessThanOrEqual(
      MAX_TAPS_TO_A_CONTACT,
    );
  });
}

test('keeps the fixed chrome to a small share of the screen', async ({
  page,
}, testInfo) => {
  testInfo.skip(sizeOf(testInfo) !== 'phone', 'measured at phone');
  await openHydrated(page, '/projets');
  await settle(page);
  const size = page.viewportSize();

  const chrome = [
    await edgesOf(pageBarOf(page)),
    await edgesOf(page.locator('app-social-links')),
    await edgesOf(dockOf(page)),
  ];

  await expect(dockOf(page).getByRole('link'), 'empty dock').toHaveCount(0);
  const share =
    chrome.reduce((sum, edges) => sum + areaOf(edges), 0) /
    ((size?.width ?? 1) * (size?.height ?? 1));
  expect(share, 'share of the screen').toBeLessThanOrEqual(MAX_CHROME_SHARE);
});

for (const { path, name } of [
  { path: '/', name: 'Fenêtres rangées' },
  { path: '/en', name: 'Put-away windows' },
]) {
  test(`names the dock, ${path}`, async ({ page }, testInfo) => {
    skipOffPhone(testInfo);
    await openHydrated(page, path);

    await expect(
      page.getByRole('navigation', { name }),
      'the dock',
    ).toHaveCount(1);
    await expect(dockOf(page).getByRole('link'), 'empty').toHaveCount(0);
  });
}

for (const { kind, path } of [
  { kind: 'detail', path: '/projet/bkone' },
  { kind: 'preview', path: '/' },
]) {
  test(`anchors the camera on the glass where it arrives, ${kind}`, async ({
    page,
  }, testInfo) => {
    skipOffPortrait(testInfo);
    await openHydrated(page, path);
    await settle(page);
    if (kind === 'preview') {
      await openPreview(page);
    }
    const size = page.viewportSize();
    const anchor = page.locator(`[data-panel="${kind}"]`);
    const arrived = await edgesOf(anchor);

    expect(arrived.left, 'left edge').toBeCloseTo(0, 0);
    expect(arrived.right, 'right edge').toBeCloseTo(size?.width ?? 0, 0);
    expect(arrived.top / (size?.height ?? 1), 'top, share').toBeGreaterThan(
      0.5,
    );
    if (kind === 'detail') {
      expect(arrived.top / (size?.height ?? 1), 'top, share').toBeCloseTo(
        0.6,
        2,
      );
      await raiseGlass(page);
      expect(await edgesOf(anchor), 'unmoved by the rise').toEqual(arrived);
    }
  });
}

const segmentedRowsOf = (page: Page) =>
  openWindowOf(page)
    .locator('app-segmented')
    .evaluateAll((sets) =>
      sets.map((set) => ({
        tops: new Set(
          [...set.querySelectorAll('button')].map((button) =>
            Math.round(button.getBoundingClientRect().top),
          ),
        ).size,
        pageOverflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      })),
    );

for (const glassPage of GLASS_PAGES.filter(({ name }) =>
  ['index', 'about'].includes(name),
)) {
  test(`holds every segmented of the glass on one row, ${glassPage.name}`, async ({
    page,
  }, testInfo) => {
    skipOffPhone(testInfo);
    await openGlassPage(page, glassPage);

    const rows = await segmentedRowsOf(page);

    expect(rows.length, 'segmented sets').toBeGreaterThan(0);
    expect(
      rows.map(({ tops }) => tops),
      'rows of each set',
    ).toEqual(rows.map(() => 1));
    expect(
      Math.max(...rows.map(({ pageOverflow }) => pageOverflow)),
      'page scroll sideways, in px',
    ).toBeLessThanOrEqual(0);
  });
}

for (const glassPage of GLASS_PAGES.filter(({ name }) => name !== 'about')) {
  test(`shows the counter of the glass bar whole, ${glassPage.name}`, async ({
    page,
  }, testInfo) => {
    skipOffPhone(testInfo);
    await openGlassPage(page, glassPage);

    const meta = openWindowOf(page).locator('.titlebar .meta');

    await expect(meta, 'the counter').toBeVisible();
    expect(
      await meta.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      ),
      'counter cut off, in px',
    ).toBeLessThanOrEqual(0);
  });
}

for (const glassPage of GLASS_PAGES.filter(({ name }) =>
  ['index', 'about'].includes(name),
)) {
  test(`shows a short glass title whole at 320, ${glassPage.name}`, async ({
    page,
  }, testInfo) => {
    testInfo.skip(sizeOf(testInfo) !== 'phone-xs', 'the smallest phone');
    await openGlassPage(page, glassPage);

    const title = openWindowOf(page).locator('.titlebar h2');

    await expect(title, 'the title').toBeVisible();
    expect(
      await title.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      ),
      'title cut off, in px',
    ).toBeLessThanOrEqual(0);
  });
}
