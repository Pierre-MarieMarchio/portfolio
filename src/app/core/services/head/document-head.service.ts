import { DOCUMENT, inject, Service } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DEFAULT_LANG, Lang, LANGS } from '../../models';

export const SITE_NAME = 'Pierre-Marie Marchio';

const SITE_URL = 'https://pierre-mariemarchio.github.io/portfolio';

const absoluteUrl = (path: string): string => `${SITE_URL}${path}`;

const OG_LOCALES: Readonly<Record<Lang, string>> = {
  fr: 'fr_FR',
  en: 'en_GB',
};

export interface HeadContent {
  readonly title: string | undefined;
  readonly description: string | null;
  readonly lang: Lang;
  readonly alternates: Readonly<Record<Lang, string>> | null;
}

@Service()
export class DocumentHeadService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  public set({ title, description, lang, alternates }: HeadContent): void {
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

  private describe(description: string | null): void {
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });

      return;
    }

    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:description"');
  }

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
