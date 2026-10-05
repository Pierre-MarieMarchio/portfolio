import type { MinimizableWindow, ObservatoryView } from '../models';

export type Tab = 'home' | 'index' | 'about';

export const TABS: readonly Tab[] = ['home', 'index', 'about'];

export function tabOf(view: ObservatoryView): Tab {
  return view === 'home' || view === 'about' ? view : 'index';
}

export function tabOfWindow(window: MinimizableWindow): Tab {
  return window === 'about' ? 'about' : 'index';
}

export function windowsOfTab(tab: Tab): readonly MinimizableWindow[] {
  switch (tab) {
    case 'home': {
      return [];
    }
    case 'index': {
      return ['index', 'sheet'];
    }
    case 'about': {
      return ['about'];
    }
  }
}
