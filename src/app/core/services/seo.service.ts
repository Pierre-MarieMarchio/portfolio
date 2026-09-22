import { inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';

/**
 * The document's meta tags. Written through Angular's `Meta`, which works on
 * the server's document as well, so each prerendered page carries its own.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);

  /**
   * A page without a description loses the previous page's one rather than
   * inheriting it: a stale description is worse than none.
   */
  public describe(description: string | null): void {
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });

      return;
    }

    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:description"');
  }

  public name(title: string): void {
    this.meta.updateTag({ property: 'og:title', content: title });
  }
}
