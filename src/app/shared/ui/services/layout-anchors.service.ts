import { Injectable } from '@angular/core';

interface LayoutAnchor {
  readonly el: HTMLElement;
  readonly kind: string;
}

@Injectable({ providedIn: 'root' })
export class LayoutAnchorsService {
  private readonly anchors = new Set<LayoutAnchor>();

  public register(el: HTMLElement, kind: string): () => void {
    const anchor = { el, kind };
    this.anchors.add(anchor);
    return () => {
      this.anchors.delete(anchor);
    };
  }

  public list(kind: string): readonly HTMLElement[] {
    return [...this.anchors]
      .filter((anchor) => anchor.kind === kind)
      .map((anchor) => anchor.el)
      .sort(inDocumentOrder);
  }
}

function inDocumentOrder(a: Node, b: Node): number {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
}
