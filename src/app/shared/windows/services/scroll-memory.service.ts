import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollMemoryService {
  private readonly positions = new Map<string, number>();

  public read(key: string): number {
    return this.positions.get(key) ?? 0;
  }

  public save(key: string, top: number): void {
    this.positions.set(key, top);
  }
}
