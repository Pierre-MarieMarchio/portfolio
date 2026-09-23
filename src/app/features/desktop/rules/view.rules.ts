import { DesktopView, DesktopWindow } from '../models';

/** The views a step back can lead to; their address is the composition's. */
export type ParentView = 'home' | 'index';

/** What stepping back one notch does, when there is a notch to go. */
export type StepBack =
  | { readonly kind: 'deselect' }
  | { readonly kind: 'close-preview' }
  | { readonly kind: 'navigate'; readonly to: ParentView };

/**
 * The two gestures that step back. Escape reaches further than a click in
 * the void: from the index or "about" it goes home, and from an unknown
 * address back to the list, where a click in the void (which only shows
 * over something to close) closes that and nothing more. This is the
 * mockup's behaviour, kept on purpose.
 */
export type StepBackGesture = 'escape' | 'void';

export interface StepBackFrom {
  readonly view: DesktopView;
  readonly selection: string | null;
  readonly preview: string | null;
}

/** The view a view steps back to, where it has one. */
export function parentOf(view: DesktopView): ParentView | null {
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

export function windowOf(view: DesktopView): DesktopWindow | null {
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

/**
 * One notch back, never more: selection → overview, sheet → index, index
 * and "about" → home (Escape only), preview → closed. `null` when there is
 * nothing to step back from. The one rule the effects and the void button
 * both read.
 */
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
