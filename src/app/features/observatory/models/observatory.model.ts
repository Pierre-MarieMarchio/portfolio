export type ObservatoryView =
  'home' | 'index' | 'sheet' | 'about' | 'not-found';

export const OBSERVATORY_WINDOWS = [
  'about',
  'index',
  'sheet',
  'preview',
] as const;

export type ObservatoryWindow = (typeof OBSERVATORY_WINDOWS)[number];

export type ObservatoryPins = Readonly<Record<ObservatoryWindow, boolean>>;

export interface Planet {
  readonly slug: string;
  readonly title: string;
  readonly short: string;
}
