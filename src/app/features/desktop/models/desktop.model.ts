export type DesktopView = 'home' | 'index' | 'sheet' | 'about' | 'not-found';

export const DESKTOP_WINDOWS = ['about', 'index', 'sheet', 'preview'] as const;

export type DesktopWindow = (typeof DESKTOP_WINDOWS)[number];

export type DesktopPins = Readonly<Record<DesktopWindow, boolean>>;

export interface Planet {
  readonly slug: string;
  readonly title: string;
  readonly short: string;
}
