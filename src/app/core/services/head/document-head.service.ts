import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DEFAULT_LANG, Lang, LANGS } from '../../models';

/** Appended to every page title, so a tab says whose site it is. */
export const SITE_NAME = 'Pierre-Marie Marchio';

/**
 * Where the site is published, for the head's absolute links: a canonical
 * or an `hreflang` must name the full address, not a path.
 */
export const SITE_URL = 'https://pierre-mariemarchio.github.io/portfolio';

const absoluteUrl = (path: string): string => `${SITE_URL}${path}`;

/** The locale each language is shared in, for the share card. */
const OG_LOCALES: Readonly<Record<Lang, string>> = {
  fr: 'fr_FR',
  en: 'en_GB',
};

/** What a page says about itself in the document's head. */
export interface HeadContent {
  /** The page's own name; the site's is appended. `undefined` leaves it alone. */
  readonly title: string | undefined;
  readonly description: string | null;
  /**
   * The page's language: its canonical and its share card's locale. Given,
   * not read: the router names the page through this service, and it
   * cannot ask a service that asks the router.
   */
  readonly lang: Lang;
  /**
   * The page's address in each language, as paths. They become the
   * `hreflang` links, and the reader's language's is the canonical.
   */
  readonly alternates?: Readonly<Record<Lang, string>> | null;
}

/**
 * The only writer of the document's `<head>`: the tab's title, the meta
 * description, the share card and the links to the page's other languages.
 * One writer, so the tab and the card cannot disagree, and the result never
 * depends on which of two writers ran last.
 *
 * Written through Angular's `Title` and `Meta`, and the document itself for
 * the links, which all work on the server's document as well, so each
 * prerendered page carries its own.
 */
@Injectable({ providedIn: 'root' })
export class DocumentHeadService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  public set({
    title,
    description,
    lang,
    alternates = null,
  }: HeadContent): void {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({
      property: 'og:locale',
      content: OG_LOCALES[lang],
    });
    this.describe(description);
    this.link(lang, alternates);
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

  /**
   * The canonical, and one `hreflang` link per language plus `x-default`
   * (the French one, at the root). Rewritten whole on each page: links left
   * from the previous page would point a search engine at the wrong one.
   */
  private link(
    lang: Lang,
    alternates: Readonly<Record<Lang, string>> | null,
  ): void {
    const head = this.document.head;
    head.querySelectorAll('link[data-page-head]').forEach((each) => {
      each.remove();
    });
    if (!alternates) {
      return;
    }
    const add = (attributes: Readonly<Record<string, string>>): void => {
      const element = this.document.createElement('link');
      for (const [name, value] of Object.entries({
        ...attributes,
        'data-page-head': '',
      })) {
        element.setAttribute(name, value);
      }
      head.insertBefore(element, null);
    };
    add({ rel: 'canonical', href: absoluteUrl(alternates[lang]) });
    for (const lang of LANGS) {
      add({
        rel: 'alternate',
        hreflang: lang,
        href: absoluteUrl(alternates[lang]),
      });
    }
    add({
      rel: 'alternate',
      hreflang: 'x-default',
      href: absoluteUrl(alternates[DEFAULT_LANG]),
    });
  }
}
