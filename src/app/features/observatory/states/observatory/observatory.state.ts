import { Service, signal } from '@angular/core';
import { ObservatoryPins, ObservatoryView } from '../../models';

export const NO_PINS: ObservatoryPins = {
  index: false,
  sheet: false,
  about: false,
  preview: false,
};

@Service()
export class ObservatoryState {
  public readonly view = signal<ObservatoryView>('home');
  public readonly slug = signal<string | null>(null);
  public readonly chapter = signal(0);
  public readonly section = signal(0);
  public readonly visited = signal<readonly string[]>([]);
  public readonly pins = signal<ObservatoryPins>(NO_PINS);
  public readonly preview = signal<string | null>(null);
  public readonly lastPreview = signal<string | null>(null);
  public readonly lastSheet = signal<string | null>(null);
  public readonly selected = signal<string | null>(null);
  public readonly hovered = signal<string | null>(null);
  public readonly family = signal('all');
}
