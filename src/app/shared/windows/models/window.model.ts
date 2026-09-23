export type WindowSize = 's' | 'm' | 'l';

export type WindowAnchor = 'top' | 'bottom';

export const WINDOW_CEILINGS: Readonly<Record<WindowSize, number>> = {
  s: 300,
  m: 470,
  l: 920,
};
