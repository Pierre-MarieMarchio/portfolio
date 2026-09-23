import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/** Appended to every page title, so a tab says whose site it is. */
export const SITE_NAME = 'Pierre-Marie Marchio';

/** What a page says about itself in the document's head. */
export interface PageHeadContent {
  /** The page's own name; the site's is appended. `undefined` leaves it alone. */
  readonly title: string | undefined;
  readonly description: string | null;
}

/**
 * The only writer of the document's `<head>`: the tab's title, the meta
 * description and the share card. One writer, so the tab and the card cannot
 * disagree, and the result never depends on which of two writers ran last.
 *
 * Written through Angular's `Title` and `Meta`, which work on the server's
 * document as well, so each prerendered page carries its own.
 */
@Injectable({ providedIn: 'root' })
export class PageHead {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  public set({ title, description }: PageHeadContent): void {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.describe(description);
  }

  /**
   * A page without a description loses the previous page's one rather than
   * inheriting it: a stale description is worse than none.
   */
  private describe(description: string | null): void {
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });

      return;
    }

    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:description"');
  }
}
