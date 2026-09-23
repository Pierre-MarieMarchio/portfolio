import { Location } from '@angular/common';
import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Lang, langOfUrl } from './lang';

/**
 * The language the reader is in, read from the address (D3, D4): nothing
 * stores it, so a link, a reload, the prerender and a shared URL all agree.
 * It follows every navigation, and writes `lang` on the document's root,
 * where assistive technologies and the browser read it, on the server too.
 *
 * Switching language is a navigation to the other address of the same view:
 * the application stays mounted, and nothing the reader set up is lost.
 */
@Injectable({ providedIn: 'root' })
export class Locale {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  /**
   * From the address the page was loaded at: the router has not navigated
   * yet when the initializer asks, and `Location` already knows it, the
   * base href taken off.
   */
  private readonly address = signal(inject(Location).path() || '/');
  private readonly current = signal<Lang>(langOfUrl(this.address()));

  public readonly lang = this.current.asReadonly();
  /** The address on show, for the switch to offer the same page in another. */
  public readonly path = this.address.asReadonly();

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.address.set(event.urlAfterRedirects);
        this.set(langOfUrl(event.urlAfterRedirects));
      });
  }

  /**
   * Taken at once for an address about to load, before the router gets
   * there: the initializer loads its catalogue, and the first render must
   * already speak its language.
   */
  public set(lang: Lang): void {
    this.current.set(lang);
    this.document.documentElement.setAttribute('lang', lang);
  }
}
