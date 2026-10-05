// @ts-check
/**
 * What the prerendered pages must hold, checked on the build's output.
 *
 * The prerender renders each page in a DOM without layout (Domino), where a
 * browser API that jsdom has may be missing. A throw there does not fail the
 * build: the page is written anyway, from whatever state was reached, and
 * every page came out as the home page once. The specs run in jsdom and
 * cannot see it; this reads the files a reader without JavaScript gets.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'dist/portfolio/browser';

/**
 * @typedef {object} Page
 * @property {string} path     The address, for the message.
 * @property {string} file     The prerendered file, under ROOT.
 * @property {'fr' | 'en'} lang The language the address is in (D4).
 * @property {string[]} holds  Elements the page must contain.
 * @property {string[]} lacks  Elements it must not.
 */

const sheets = readdirSync(join(ROOT, 'projet'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/**
 * @param {string} html
 * @param {string} rel
 * @returns {string[]}
 */
const linksOf = (html, rel) =>
  [...html.matchAll(/<link\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => tag.includes(`rel="${rel}"`))
    .map((tag) => /\bhref="([^"]*)"/.exec(tag)?.[1] ?? '');

const homeCanonical = linksOf(
  readFileSync(join(ROOT, 'index.html'), 'utf8'),
  'canonical',
)[0];
const siteAddress = (homeCanonical ?? '').replace(/\/$/, '');

/**
 * The address of a page's English twin, read from the hreflang link the page
 * itself carries, so the English prefix is written once, in src/ (D4).
 * @param {string} file The French page, under ROOT.
 * @returns {string} The address under the site, leading slash included.
 */
const englishAddressOf = (file) => {
  const html = readFileSync(join(ROOT, file), 'utf8');
  const tag = [...html.matchAll(/<link\b[^>]*>/g)]
    .map((match) => match[0])
    .find((link) => link.includes('hreflang="en"'));
  const href = /\bhref="([^"]*)"/.exec(tag ?? '')?.[1] ?? '';
  return href.startsWith(siteAddress) ? href.slice(siteAddress.length) : '';
};

/**
 * Every view in French, the language at the root of the site.
 * @returns {Page[]}
 */
const frenchPages = () => [
  {
    path: '/',
    file: 'index.html',
    lang: /** @type {const} */ ('fr'),
    holds: ['<app-home-title', '<app-featured-bar', '<app-intro-card'],
    lacks: ['<app-window'],
  },
  {
    path: '/projets',
    file: join('projets', 'index.html'),
    lang: /** @type {const} */ ('fr'),
    holds: ['<app-project-list', '<app-window'],
    lacks: ['<app-home-title', '<app-intro-card'],
  },
  {
    path: '/a-propos',
    file: join('a-propos', 'index.html'),
    lang: /** @type {const} */ ('fr'),
    holds: ['<app-about-window', '<app-window'],
    lacks: ['<app-home-title', '<app-intro-card'],
  },
  ...sheets.map((slug) => ({
    path: `/projet/${slug}`,
    file: join('projet', slug, 'index.html'),
    lang: /** @type {const} */ ('fr'),
    holds: ['<app-project-detail', '<app-window'],
    lacks: ['<app-home-title', '<app-not-found-window', '<app-intro-card'],
  })),
];

const FRENCH_PAGES = frenchPages();

/**
 * Each French page has an English twin with the same expectations, at the
 * address the French page links to.
 * @type {Page[]}
 */
const ENGLISH_PAGES = FRENCH_PAGES.map((page) => {
  const path = englishAddressOf(page.file);
  return {
    ...page,
    path: path || '/',
    file: join(path.replace(/^\//, ''), 'index.html'),
    lang: 'en',
  };
});

/** @type {Page[]} */
const PAGES = [...FRENCH_PAGES, ...ENGLISH_PAGES];

const englishPrefix = ENGLISH_PAGES[0]?.path.replace(/^\//, '') ?? '';

/**
 * The visible words of a page, and its accessible names: what a reader of
 * that language gets. French is told by its accents, which no English text
 * of the site carries; the language switch names French in French.
 * @param {string} html
 */
const wordsOf = (html) => {
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

/**
 * The not-found pages, one per language, which the server's error document
 * serves: a real page, kept out of the index.
 * @type {{ file: string, lang: 'fr' | 'en' }[]}
 */
const NOT_FOUND_PAGES = [
  { file: '404.html', lang: 'fr' },
  { file: join(englishPrefix, '404.html'), lang: 'en' },
];

/**
 * @param {boolean} condition
 * @param {string} message
 * @returns {string[]}
 */
const when = (condition, message) => (condition ? [message] : []);

/**
 * @param {string} file
 * @returns {string}
 */
const readIfExists = (file) =>
  existsSync(join(ROOT, file)) ? readFileSync(join(ROOT, file), 'utf8') : '';

/**
 * @param {string} html
 * @returns {string[]}
 */
const headingFailures = (html) => {
  const headings = html.match(/<h1[\s>]/g)?.length ?? 0;
  return when(headings !== 1, `${String(headings)} <h1>, one expected`);
};

/**
 * @param {string} html
 * @param {string} lang
 * @returns {string[]}
 */
const languageFailures = (html, lang) =>
  when(
    !/<html[^>]*\slang="([a-z]+)"/.exec(html)?.[1]?.startsWith(lang),
    `<html> does not say lang="${lang}"`,
  );

/**
 * @param {Page} page
 * @param {string} html
 * @returns {string[]}
 */
const presenceFailures = ({ holds, lacks }, html) => [
  ...holds
    .filter((element) => !html.includes(element))
    .map((element) => `${element}> is missing`),
  ...lacks
    .filter((element) => html.includes(element))
    .map((element) => `${element}> should not be there`),
];

/**
 * @param {Page} page
 * @returns {string[]}
 */
const pageFailures = (page) => {
  const html = readFileSync(join(ROOT, page.file), 'utf8');
  const otherLang = page.lang === 'fr' ? 'en' : 'fr';
  return [
    ...presenceFailures(page, html),
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

/**
 * @returns {Set<string>}
 */
const declaredElements = () =>
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

/**
 * @returns {string[]}
 */
const undeclaredAbsenceFailures = () => {
  const declared = declaredElements();
  return [...new Set(PAGES.flatMap((page) => page.lacks))]
    .filter((element) => !declared.has(element))
    .map(
      (element) =>
        `${element}>: no component declares it, so its absence proves nothing`,
    );
};

/**
 * @param {{ file: string, lang: 'fr' | 'en' }} notFoundPage
 * @returns {string[]}
 */
const notFoundFailures = ({ file, lang }) => {
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

/**
 * @param {Page} page
 * @param {string[]} entries
 * @returns {string[]}
 */
const pageSitemapFailures = (page, entries) => {
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

/**
 * @returns {string[]}
 */
const sitemapFailures = () => {
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
    ...PAGES.flatMap((page) => pageSitemapFailures(page, entries)),
    ...when(/\/404</.test(sitemap), '/sitemap.xml: lists a not-found page'),
  ];
};

/**
 * @returns {string[]}
 */
const robotsFailures = () => {
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

/**
 * @returns {string[]}
 */
const allFailures = () => [
  ...PAGES.flatMap(pageFailures),
  ...undeclaredAbsenceFailures(),
  ...when(sheets.length === 0, '/projet/…: no sheet was prerendered'),
  ...NOT_FOUND_PAGES.flatMap(notFoundFailures),
  ...sitemapFailures(),
  ...robotsFailures(),
];

/**
 * @param {string[]} failures
 */
const report = (failures) => {
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
