import { ObservatoryPins, ObservatoryView, ObservatoryWindow } from '../models';
import { OBSERVATORY_WINDOWS } from '../models/observatory.model';

export type ParentView = 'home' | 'index';

type StepBack =
  | { readonly kind: 'deselect' }
  | { readonly kind: 'close-preview' }
  | { readonly kind: 'navigate'; readonly to: ParentView };

export type StepBackGesture = 'escape' | 'void';

export interface StepBackFrom {
  readonly view: ObservatoryView;
  readonly selection: string | null;
  readonly preview: string | null;
}

export function parentOf(view: ObservatoryView): ParentView | null {
  switch (view) {
    case 'sheet':
    case 'not-found': {
      return 'index';
    }
    case 'index':
    case 'about': {
      return 'home';
    }
    case 'home': {
      return null;
    }
  }
}

export function windowOf(view: ObservatoryView): ObservatoryWindow | null {
  switch (view) {
    case 'index':
    case 'about':
    case 'sheet': {
      return view;
    }
    case 'not-found': {
      return 'sheet';
    }
    case 'home': {
      return null;
    }
  }
}

export function stepBack(
  gesture: StepBackGesture,
  { view, selection, preview }: StepBackFrom,
): StepBack | null {
  if (view === 'index' && selection !== null) {
    return { kind: 'deselect' };
  }
  const parent = parentOf(view);
  if (parent !== null && (gesture === 'escape' || view === 'sheet')) {
    return { kind: 'navigate', to: parent };
  }
  return preview !== null && view === 'home' ? { kind: 'close-preview' } : null;
}

export interface DockFrom {
  readonly view: ObservatoryView;
  readonly pins: ObservatoryPins;
  readonly preview: string | null;
  readonly lastSheet: string | null;
}

export function dockedOf({
  view,
  pins,
  preview,
  lastSheet,
}: DockFrom): readonly ObservatoryWindow[] {
  const open = view === 'home' ? 'preview' : windowOf(view);
  const reopenable: Readonly<Record<ObservatoryWindow, boolean>> = {
    about: true,
    index: true,
    sheet: lastSheet !== null,
    preview: preview !== null,
  };
  return OBSERVATORY_WINDOWS.filter(
    (window) => pins[window] && window !== open && reopenable[window],
  );
}

export interface KeptFrom {
  readonly view: ObservatoryView;
  readonly pins: ObservatoryPins;
  readonly seen: readonly ObservatoryWindow[];
}

export function keptOf({
  view,
  pins,
  seen,
}: KeptFrom): readonly ObservatoryWindow[] {
  const open = windowOf(view);
  return OBSERVATORY_WINDOWS.filter(
    (window) =>
      window !== 'preview' &&
      (window === open || pins[window] || seen.includes(window)),
  );
}

export type AddressOf = (view: Exclude<ObservatoryView, 'not-found'>) => string;

export function viewAtAddress(
  path: string,
  addressOf: AddressOf,
): { readonly view: ObservatoryView; readonly slug: string | null } {
  const segments = (path.split(/[?#]/)[0] ?? '').split('/').filter(Boolean);
  const bare = `/${segments.join('/')}`;
  for (const view of ['home', 'index', 'about'] as const) {
    if (bare === addressOf(view)) {
      return { view, slug: null };
    }
  }
  const sheet = `${addressOf('sheet')}/`;
  const slug = bare.slice(sheet.length);
  return bare.startsWith(sheet) && !slug.includes('/')
    ? { view: 'sheet', slug }
    : { view: 'not-found', slug: null };
}
