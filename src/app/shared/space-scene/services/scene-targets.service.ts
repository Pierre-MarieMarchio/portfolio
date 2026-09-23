import { Injectable } from '@angular/core';

@Injectable()
export class SceneTargetsService {
  private readonly targets = new Set<HTMLElement>();

  public add(target: HTMLElement): () => void {
    this.targets.add(target);
    return () => {
      this.targets.delete(target);
    };
  }

  public list(): readonly HTMLElement[] {
    return [...this.targets].sort(inDocumentOrder);
  }
}

function inDocumentOrder(a: Node, b: Node): number {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
}
