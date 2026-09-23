import { Injectable } from '@angular/core';

/**
 * Where each reading surface was left, by key, for the whole visit. Coming
 * back to a view finds its place: the reader arms nothing, which is what
 * the mockup meant by "pinning".
 *
 * A plain map, not state: it is written on every scroll event and never
 * rendered, so nothing may be scheduled when it changes.
 */
@Injectable({ providedIn: 'root' })
export class ScrollMemoryService {
  private readonly positions = new Map<string, number>();

  public read(key: string): number {
    return this.positions.get(key) ?? 0;
  }

  public write(key: string, top: number): void {
    this.positions.set(key, top);
  }
}
