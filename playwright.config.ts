import { defineConfig, devices, type Project } from '@playwright/test';
import type { SiteOptions } from './e2e/site.fixture';

const PORT = 4310;
const IS_CI = Boolean(process.env['CI']);

type TargetSize = {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly isTouch: boolean;
};

const SIZES: readonly TargetSize[] = [
  { name: 'phone-xs', width: 320, height: 568, isTouch: true },
  { name: 'phone-s', width: 360, height: 780, isTouch: true },
  { name: 'phone', width: 390, height: 844, isTouch: true },
  { name: 'phone-landscape', width: 844, height: 390, isTouch: true },
  { name: 'tablet', width: 820, height: 1180, isTouch: true },
  { name: 'tablet-landscape', width: 1180, height: 820, isTouch: true },
  { name: 'desktop-tight', width: 924, height: 540, isTouch: false },
  { name: 'desktop', width: 1440, height: 900, isTouch: false },
];

const ENGINES = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
] as const;

const projects: Project<SiteOptions>[] = ENGINES.flatMap((engine) =>
  SIZES.map((size) => ({
    name: `${size.name}-${engine.name}`,
    use: {
      ...engine.device,
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
      hasTouch: size.isTouch,
      isMobile: size.isTouch,
      captures: true,
    },
  })),
);

export default defineConfig<SiteOptions>({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: 0,
  reporter: IS_CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${String(PORT)}`,
    reducedMotion: 'reduce',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixels: 200,
    },
  },
  projects,
  webServer: {
    command: `node e2e/pages-server.ts ${String(PORT)}`,
    url: `http://127.0.0.1:${String(PORT)}/`,
    reuseExistingServer: !IS_CI,
  },
});
