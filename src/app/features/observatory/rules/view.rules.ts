import { ObservatoryView, ObservatoryWindow } from '../models';

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
