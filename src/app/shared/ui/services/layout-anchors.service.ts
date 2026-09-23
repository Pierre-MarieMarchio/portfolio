import { Injectable } from '@angular/core';

/**
 * What a panel says to the object's framing. `head` bounds the free band at
 * the top; `rule`, `sheet` and `preview` bound the approach by their edge; a
 * panel with no role is only text the matter gives way to.
 */
export type PanelRole = '' | 'head' | 'rule' | 'sheet' | 'preview';

export interface AnchoredPanel {
  readonly element: HTMLElement;
  readonly role: () => PanelRole;
}

/**
 * The elements the object reads from the page around it: the panels it dims
 * its matter behind, and the lines of the home rule that rise with their
 * planets. They sign in through `appPanelAnchor` and `appLineAnchor`, so the
 * object never searches the whole document for an attribute it hopes someone
 * wrote, and a panel it reads is one a template declared.
 *
 * In `shared/ui`, not with the object: the templates that declare them
 * (the station's, the rule's) belong to more than one feature, and every
 * feature may reach `shared/ui`.
 *
 * Plain sets, not state: the object measures them when something changed,
 * never in a template, so nothing is scheduled when one signs in or out.
 */
@Injectable({ providedIn: 'root' })
export class LayoutAnchorsService {
  private readonly panelSet = new Set<AnchoredPanel>();
  private readonly lineSet = new Set<HTMLElement>();

  public addPanel(panel: AnchoredPanel): () => void {
    this.panelSet.add(panel);
    return () => {
      this.panelSet.delete(panel);
    };
  }

  public addLine(element: HTMLElement): () => void {
    this.lineSet.add(element);
    return () => {
      this.lineSet.delete(element);
    };
  }

  /** In document order, whatever order they signed in. */
  public panels(): readonly AnchoredPanel[] {
    return [...this.panelSet].sort((a, b) =>
      inDocumentOrder(a.element, b.element),
    );
  }

  /** In document order, which is rank order: the rule lists by rank. */
  public lines(): readonly HTMLElement[] {
    return [...this.lineSet].sort(inDocumentOrder);
  }
}

function inDocumentOrder(a: Node, b: Node): number {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
}
