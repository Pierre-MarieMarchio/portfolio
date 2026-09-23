/**
 * What the address says the reader is looking at. Raw on purpose: whether a
 * sheet's slug names a project is the catalog's business, decided where the
 * station and the projects meet, never here.
 */
export type DesktopView = 'home' | 'index' | 'sheet' | 'about' | 'not-found';

/** The four windows a reader can pin, in the order the page lays them. */
export const DESKTOP_WINDOWS = ['about', 'index', 'sheet', 'preview'] as const;

export type DesktopWindow = (typeof DESKTOP_WINDOWS)[number];

export type DesktopPins = Readonly<Record<DesktopWindow, boolean>>;
