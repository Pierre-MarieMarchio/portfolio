import { computed, Service, signal } from '@angular/core';

@Service({ autoProvided: false })
export class WindowStackService {
  private readonly registered = signal<readonly string[]>([]);
  private readonly raised = signal<readonly string[]>([]);

  private readonly order = computed<readonly string[] | null>(() => {
    const raised = this.raised();
    if (raised.length === 0) {
      return null;
    }
    const registered = this.registered();
    return [
      ...registered.filter((id) => !raised.includes(id)),
      ...raised.filter((id) => registered.includes(id)),
    ];
  });

  public register(id: string): () => void {
    this.registered.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    return () => {
      this.registered.update((ids) => ids.filter((each) => each !== id));
    };
  }

  public bringToFront(id: string): void {
    const order = this.order() ?? this.registered();
    if (order.at(-1) === id) {
      return;
    }
    this.raised.update((ids) => [...ids.filter((each) => each !== id), id]);
  }

  public depthOf(id: string): number | null {
    const depth = this.order()?.indexOf(id) ?? -1;
    return depth === -1 ? null : depth;
  }
}
