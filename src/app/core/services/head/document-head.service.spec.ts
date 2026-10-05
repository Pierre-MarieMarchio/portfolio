import { TestBed } from '@angular/core/testing';
import { SITE_NAME } from '../../ports';
import { DocumentHeadService } from './document-head.service';

const SITE = 'https://pm-marchio.fr';

const hrefs = (selector: string): (string | null)[] =>
  [...document.head.querySelectorAll(selector)].map((each) =>
    each.getAttribute('href'),
  );

const setLinks = (fr: string, en: string, lang: 'fr' | 'en' = 'fr'): void => {
  TestBed.inject(DocumentHeadService).set({
    title: undefined,
    description: null,
    lang,
    alternates: { fr, en },
  });
};

describe('DocumentHeadService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SITE_NAME, useValue: 'Pierre-Marie Marchio' }],
    });
  });

  afterEach(() => {
    document.head.querySelectorAll('link[data-page-head]').forEach((each) => {
      each.remove();
    });
  });

  it('ends the canonical address with the slash Apache serves', () => {
    setLinks('/projets', '/en/projects');

    expect(hrefs('link[rel="canonical"]')).toEqual([`${SITE}/projets/`]);
  });

  it('ends every hreflang address with the slash', () => {
    setLinks('/projets', '/en/projects');

    expect(hrefs('link[hreflang="fr"]')).toEqual([`${SITE}/projets/`]);
    expect(hrefs('link[hreflang="en"]')).toEqual([`${SITE}/en/projects/`]);
    expect(hrefs('link[hreflang="x-default"]')).toEqual([`${SITE}/projets/`]);
  });

  it('serves the sheets and the English home under a slash too', () => {
    setLinks('/projet/bkone', '/en/project/bkone', 'en');

    expect(hrefs('link[rel="canonical"]')).toEqual([
      `${SITE}/en/project/bkone/`,
    ]);

    setLinks('/', '/en');

    expect(hrefs('link[hreflang="fr"]')).toEqual([`${SITE}/`]);
    expect(hrefs('link[hreflang="en"]')).toEqual([`${SITE}/en/`]);
  });

  it('does not double a slash the path already carries', () => {
    setLinks('/projets/', '/en/projects/');

    expect(hrefs('link[rel="canonical"]')).toEqual([`${SITE}/projets/`]);
  });
});
