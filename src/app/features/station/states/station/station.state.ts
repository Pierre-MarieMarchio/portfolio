import { Injectable, signal } from '@angular/core';
import { StationPins, StationView } from '../../models';

export const NO_PINS: StationPins = {
  index: false,
  sheet: false,
  about: false,
  preview: false,
};

/**
 * The instrument's state: what outlives a navigation in the mockup outlives
 * it here. Slugs only, never ranks: the station does not know the catalog.
 */
@Injectable({ providedIn: 'root' })
export class StationState {
  public readonly view = signal<StationView>('home');
  /** The sheet's slug, on a sheet's address only. */
  public readonly slug = signal<string | null>(null);
  public readonly pins = signal<StationPins>(NO_PINS);
  /** The project shown in the home preview; `null` when it is closed. */
  public readonly preview = signal<string | null>(null);
  /**
   * The body the preview last showed, kept once it closes: the home rule's
   * reading line falls back on it when nothing is hovered.
   */
  public readonly reading = signal<string | null>(null);
  /** The open row of the index. */
  public readonly selection = signal<string | null>(null);
  /** Sheets read during the visit, marked "lu" in the index. */
  public readonly visited = signal<readonly string[]>([]);
  /** The index's family filter, `all` for none. */
  public readonly family = signal('all');
  /** The approach of the sheet on show. */
  public readonly chapter = signal(0);
  /** The part of "about" on show, from 0. */
  public readonly part = signal(0);
  /** The project under the pointer, for the object to light its planet. */
  public readonly hovered = signal<string | null>(null);
  /** The English texts were asked for; they do not exist yet. */
  public readonly englishAsked = signal(false);
  public readonly paused = signal(false);
}
