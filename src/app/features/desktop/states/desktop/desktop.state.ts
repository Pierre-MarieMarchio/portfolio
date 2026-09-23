import { Injectable, signal } from '@angular/core';
import { DesktopPins, DesktopView } from '../../models';

export const NO_PINS: DesktopPins = {
  index: false,
  sheet: false,
  about: false,
  preview: false,
};

@Injectable({ providedIn: 'root' })
export class DesktopState {
  public readonly view = signal<DesktopView>('home');
  public readonly slug = signal<string | null>(null);
  public readonly chapter = signal(0);
  public readonly section = signal(0);
  public readonly visited = signal<readonly string[]>([]);
  public readonly pins = signal<DesktopPins>(NO_PINS);
  public readonly preview = signal<string | null>(null);
  public readonly lastPreview = signal<string | null>(null);
  public readonly selected = signal<string | null>(null);
  public readonly hovered = signal<string | null>(null);
  public readonly family = signal('all');
}
