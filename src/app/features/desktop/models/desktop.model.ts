/**
 * What the address says the reader is looking at. Raw on purpose: whether a
 * sheet's slug names a project is the catalog's business, decided where the
 * station and the projects meet, never here.
 */
export type DesktopView = 'home' | 'index' | 'sheet' | 'about' | 'not-found';

/** The four windows a reader can pin. */
export type DesktopWindow = 'index' | 'sheet' | 'about' | 'preview';

export type DesktopPins = Readonly<Record<DesktopWindow, boolean>>;
