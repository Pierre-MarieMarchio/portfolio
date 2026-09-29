import { computed, Service, signal } from '@angular/core';

@Service({ autoProvided: false })
export class WindowStackService {
  private readonly registered = signal<readonly string[]>([]);
  private readonly raised = signal<readonly string[]>([]);
  private readonly elements = new Map<string, HTMLElement>();

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

  public register(id: string, element?: HTMLElement): () => void {
    this.registered.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    if (element) {
      this.elements.set(id, element);
    }
    return () => {
      this.registered.update((ids) => ids.filter((each) => each !== id));
      if (this.elements.get(id) === element) {
        this.elements.delete(id);
      }
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

  public frontShownOf(excluding: HTMLElement): HTMLElement | null {
    return (
      this.shownFrontToBack().find((element) => element !== excluding) ?? null
    );
  }

  public shownFrontToBack(): readonly HTMLElement[] {
    const order = this.order() ?? this.registered();
    const shown: HTMLElement[] = [];
    for (let depth = order.length - 1; depth >= 0; depth -= 1) {
      const element = this.elements.get(order[depth] ?? '');
      if (element?.dataset['shown'] === 'true') {
        shown.push(element);
      }
    }
    return shown;
  }
}
