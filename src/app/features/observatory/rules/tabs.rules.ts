import { ObservatoryView } from '../models';

export type Tab = 'home' | 'index' | 'about';

export function tabOf(view: ObservatoryView): Tab {
  return view === 'home' || view === 'about' ? view : 'index';
}
