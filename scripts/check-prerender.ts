import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'dist/portfolio/browser';

type Language = 'fr' | 'en';

interface Page {
  path: string;
  file: string;
  lang: Language;
  holds: string[];
  lacks: string[];
}

interface NotFoundPage {
  file: string;
  lang: Language;
}

const sheets = readdirSync(join(ROOT, 'projet'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const linksOf = (html: string, rel: string): string[] =>
  [...html.matchAll(/<link\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => tag.includes(`rel="${rel}"`))
    .map((tag) => /\bhref="([^"]*)"/.exec(tag)?.[1] ?? '');

const homeCanonical = linksOf(
  readFileSync(join(ROOT, 'index.html'), 'utf8'),
  'canonical',
)[0];
const siteAddress = (homeCanonical ?? '').replace(/\/$/, '');

const englishAddressOf = (file: string): string => {
  const html = readFileSync(join(ROOT, file), 'utf8');
  const tag = [...html.matchAll(/<link\b[^>]*>/g)]
    .map((match) => match[0])
    .find((link) => link.includes('hreflang="en"'));
  const href = /\bhref="([^"]*)"/.exec(tag ?? '')?.[1] ?? '';
  return href.startsWith(siteAddress) ? href.slice(siteAddress.length) : '';
};

const servedFailures = (address: string, label: string): string[] => {
  if (!address.endsWith('/')) {
    return [`${label} ${address} does not end with /`];
  }
  if (!address.startsWith(siteAddress)) {
    return [`${label} ${address} is not under ${siteAddress}`];
  }
  const directory = address.slice(siteAddress.length).replace(/^\//, '');
  return existsSync(join(ROOT, directory, 'index.html'))
    ? []
    : [`${label} ${address} is not a prerendered index.html`];
};

const frenchPages = (): Page[] => [
  {
    path: '/',
    file: 'index.html',
    lang: 'fr',
    holds: ['<app-home-title', '<app-featured-bar', '<app-intro-card'],
    lacks: ['<app-window'],
  },
  {
    path: '/projets/',
    file: join('projets', 'index.html'),
    lang: 'fr',
    holds: ['<app-project-list', '<app-window'],
    lacks: ['<app-home-title', '<app-intro-card'],
  },
  {
    path: '/a-propos/',
    file: join('a-propos', 'index.html'),
    lang: 'fr',
    holds: ['<app-about-window', '<app-window'],
    lacks: ['<app-home-title', '<app-intro-card'],
  },
  ...sheets.map((slug): Page => ({
    path: `/projet/${slug}/`,
    file: join('projet', slug, 'index.html'),
    lang: 'fr',
    holds: ['<app-project-detail', '<app-window'],
    lacks: ['<app-home-title', '<app-not-found-window', '<app-intro-card'],
  })),
];

const FRENCH_PAGES = frenchPages();

const ENGLISH_PAGES: Page[] = FRENCH_PAGES.map((page) => {
  const path = englishAddressOf(page.file);
  return {
    ...page,
    path: path || '/',
    file: join(path.replace(/^\//, ''), 'index.html'),
    lang: 'en',
  };
});

const PAGES: Page[] = [...FRENCH_PAGES, ...ENGLISH_PAGES];

const englishPrefix = ENGLISH_PAGES[0]?.path.replace(/^\//, '') ?? '';

const wordsOf = (html: string): string => {
  const body = html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '')
    .replace(/<head[\s\S]*?<\/head>/, '');
  const names = [...body.matchAll(/(?:aria-label|title)="([^"]*)"/g)].map(
    (match) => match[1],
  );
  return [body.replace(/<[^<>]+>/g, ' '), ...names]
    .join(' ')
    .replaceAll('Français', '');
};

const NOT_FOUND_PAGES: NotFoundPage[] = [
  { file: '404.html', lang: 'fr' },
  { file: join(englishPrefix, '404.html'), lang: 'en' },
];

const when = (condition: boolean, message: string): string[] =>
  condition ? [message] : [];

const readIfExists = (file: string): string =>
  existsSync(join(ROOT, file)) ? readFileSync(join(ROOT, file), 'utf8') : '';

const headingFailures = (html: string): string[] => {
  const headings = html.match(/<h1[\s>]/g)?.length ?? 0;
  return when(headings !== 1, `${String(headings)} <h1>, one expected`);
};

const languageFailures = (html: string, lang: Language): string[] =>
  when(
    !/<html[^>]*\slang="([a-z]+)"/.exec(html)?.[1]?.startsWith(lang),
    `<html> does not say lang="${lang}"`,
  );

const presenceFailures = (
  { holds, lacks }: Pick<Page, 'holds' | 'lacks'>,
  html: string,
): string[] => [
  ...holds
    .filter((element) => !html.includes(element))
    .map((element) => `${element}> is missing`),
  ...lacks
    .filter((element) => html.includes(element))
    .map((element) => `${element}> should not be there`),
];

const addressFailures = (html: string): string[] => {
  const canonicals = linksOf(html, 'canonical');
  return [
    ...when(canonicals.length !== 1, 'does not have exactly one canonical'),
    ...canonicals.flatMap((href) => servedFailures(href, 'canonical')),
    ...linksOf(html, 'alternate').flatMap((href) =>
      servedFailures(href, 'hreflang'),
    ),
  ];
};

const pageFailures = (page: Page): string[] => {
  const html = readFileSync(join(ROOT, page.file), 'utf8');
  const otherLang = page.lang === 'fr' ? 'en' : 'fr';
  return [
    ...presenceFailures(page, html),
    ...addressFailures(html),
    ...when(
      /<dialog[^>]*sopen[s=>]/.test(html),
      'a <dialog> is open before any reader asked',
    ),
    ...headingFailures(html),
    ...languageFailures(html, page.lang),
    ...when(
      !html.includes(`hreflang="${otherLang}"`),
      'the head links no other language',
    ),
    ...when(
      page.lang === 'en' && /[àâçéèêëîïôûùœ]/i.test(wordsOf(html)),
      'French words on an English page',
    ),
  ].map((why) => `${page.path}: ${why}`);
};

const declaredElements = (): Set<string> =>
  new Set(
    readdirSync('src/app', { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.component.ts'))
      .flatMap((file) => [
        ...readFileSync(join('src/app', file), 'utf8').matchAll(
          /selector: '([a-z-]+)'/g,
        ),
      ])
      .map((match) => `<${match[1] ?? ''}`),
  );

const undeclaredAbsenceFailures = (): string[] => {
  const declared = declaredElements();
  return [...new Set(PAGES.flatMap((page) => page.lacks))]
    .filter((element) => !declared.has(element))
    .map(
      (element) =>
        `${element}>: no component declares it, so its absence proves nothing`,
    );
};

const notFoundFailures = ({ file, lang }: NotFoundPage): string[] => {
  if (!existsSync(join(ROOT, file))) {
    return [`${file}: was not written`];
  }
  const html = readFileSync(join(ROOT, file), 'utf8');
  return [
    ...when(
      !html.includes('<app-not-found-window'),
      '<app-not-found-window> is missing',
    ),
    ...when(
      !/<meta name="robots" content="noindex">/.test(html),
      'is not marked noindex',
    ),
    ...when(/rel="canonical"/.test(html), 'declares a canonical address'),
    ...headingFailures(html),
    ...languageFailures(html, lang),
    ...when(
      existsSync(join(ROOT, file.replace(/\.html$/, ''))),
      'is also left as a directory',
    ),
  ].map((why) => `${file}: ${why}`);
};

const pageSitemapFailures = (page: Page, entries: string[]): string[] => {
  const html = readFileSync(join(ROOT, page.file), 'utf8');
  const canonical = linksOf(html, 'canonical')[0];
  const entry = entries.find((candidate) =>
    candidate.includes(`<loc>${canonical ?? ''}</loc>`),
  );
  if (canonical === undefined || entry === undefined) {
    return [`${page.path}: not in /sitemap.xml`];
  }
  return [
    ...linksOf(html, 'alternate')
      .filter((alternate) => !entry.includes(`href="${alternate}"`))
      .map(
        (alternate) =>
          `${page.path}: /sitemap.xml lacks the alternate ${alternate}`,
      ),
    ...['fr', 'en', 'x-default']
      .filter((hreflang) => !entry.includes(`hreflang="${hreflang}"`))
      .map(
        (hreflang) => `${page.path}: /sitemap.xml lacks hreflang="${hreflang}"`,
      ),
  ];
};

const locFailures = (entry: string): string[] =>
  [...entry.matchAll(/<loc>([^<]*)<\/loc>/g)].flatMap((match) =>
    servedFailures(match[1] ?? '', '/sitemap.xml <loc>'),
  );

const sitemapFailures = (): string[] => {
  const sitemap = readIfExists('sitemap.xml');
  const entries = sitemap.split('<url>').slice(1);
  const wellFormed =
    sitemap.startsWith('<?xml') && sitemap.trimEnd().endsWith('</urlset>');
  return [
    ...when(!wellFormed, '/sitemap.xml: missing or not a <urlset> document'),
    ...when(
      entries.length !== PAGES.length,
      `/sitemap.xml: ${String(entries.length)} <url>, ${String(PAGES.length)} pages prerendered`,
    ),
    ...entries.flatMap(locFailures),
    ...PAGES.flatMap((page) => pageSitemapFailures(page, entries)),
    ...when(/\/404</.test(sitemap), '/sitemap.xml: lists a not-found page'),
  ];
};

const robotsFailures = (): string[] => {
  const robots = readIfExists('robots.txt');
  const allowsEverything =
    /^User-agent: \*$/m.test(robots) && /^Allow: \/$/m.test(robots);
  const givesSitemap =
    homeCanonical !== undefined &&
    robots.includes(`Sitemap: ${homeCanonical.replace(/\/$/, '')}/sitemap.xml`);
  return [
    ...when(
      !allowsEverything,
      '/robots.txt: missing or does not allow everything',
    ),
    ...when(!givesSitemap, '/robots.txt: does not give the sitemap address'),
  ];
};

const allFailures = (): string[] => [
  ...PAGES.flatMap(pageFailures),
  ...undeclaredAbsenceFailures(),
  ...when(sheets.length === 0, '/projet/…: no sheet was prerendered'),
  ...NOT_FOUND_PAGES.flatMap(notFoundFailures),
  ...sitemapFailures(),
  ...robotsFailures(),
];

const report = (failures: string[]): void => {
  if (failures.length > 0) {
    console.error(`check-prerender: ${String(failures.length)} failure(s)`);
    failures.forEach((failure) => {
      console.error(`  ${failure}`);
    });
    process.exit(1);
  }
  console.log(
    `check-prerender: ${String(PAGES.length)} pages, the not-found pages, the sitemap and robots.txt hold what they should.`,
  );
};

report(allFailures());
