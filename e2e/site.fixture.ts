import {
  test as base,
  expect,
  type ConsoleMessage,
  type Page,
  type TestInfo,
} from '@playwright/test';

export type SiteOptions = {
  readonly captures: boolean;
};

type SiteFixtures = {
  readonly consoleMessages: readonly string[];
};

export const sizeOf = (info: TestInfo): string =>
  info.project.name.replace(/-(chromium|webkit)$/, '');

export const openHydrated = async (page: Page, path: string): Promise<void> => {
  await page.goto(path);
  await expect(page.locator('[ngh]'), 'hydrated').toHaveCount(0);
};

const isReported = (message: ConsoleMessage): boolean =>
  message.type() === 'error' || message.type() === 'warning';

const isOwnNotFoundStatus = (
  message: ConsoleMessage,
  notFoundPages: ReadonlySet<string>,
): boolean =>
  notFoundPages.has(message.location().url) &&
  message.text().startsWith('Failed to load resource');

export const test = base.extend<SiteOptions & SiteFixtures>({
  captures: [false, { option: true }],
  consoleMessages: async ({ page }, use) => {
    const messages: string[] = [];
    const notFoundPages = new Set<string>();
    page.on('response', (response) => {
      if (
        response.status() === 404 &&
        response.request().isNavigationRequest()
      ) {
        notFoundPages.add(response.url());
      }
    });
    page.on('console', (message) => {
      if (isReported(message) && !isOwnNotFoundStatus(message, notFoundPages)) {
        messages.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => {
      messages.push(`pageerror: ${error.message}`);
    });
    await use(messages);
  },
});

export { expect } from '@playwright/test';
