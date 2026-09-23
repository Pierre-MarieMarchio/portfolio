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
import { readdirSync, readFileSync } from 'node:fs';
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
 * Every view, in both languages: French at the root, English under `/en`.
 * @param {'fr' | 'en'} lang
 * @param {{ home: string, index: string, about: string, sheet: string }} at
 * @returns {Page[]}
 */
const pagesIn = (lang, at) => [
  {
    path: `/${at.home}`,
    file: join(at.home, 'index.html'),
    lang,
    holds: ['<app-home-title', '<app-featured-bar'],
    lacks: ['<app-window'],
  },
  {
    path: `/${at.index}`,
    file: join(at.index, 'index.html'),
    lang,
    holds: ['<app-project-list'],
    lacks: ['<app-home-title'],
  },
  {
    path: `/${at.about}`,
    file: join(at.about, 'index.html'),
    lang,
    holds: ['<app-about-window'],
    lacks: ['<app-home-title'],
  },
  ...sheets.map((slug) => ({
    path: `/${at.sheet}/${slug}`,
    file: join(at.sheet, slug, 'index.html'),
    lang,
    holds: ['<app-project-detail'],
    lacks: ['<app-home-title', '<app-not-found-window'],
  })),
];

/** @type {Page[]} */
const PAGES = [
  ...pagesIn('fr', {
    home: '',
    index: 'projets',
    about: 'a-propos',
    sheet: 'projet',
  }),
  ...pagesIn('en', {
    home: 'en',
    index: 'en/projects',
    about: 'en/about',
    sheet: 'en/project',
  }),
];

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
  return [body.replace(/<[^>]+>/g, ' '), ...names]
    .join(' ')
    .replace(/Français/g, '');
};

/** @type {string[]} */
const failures = [];

for (const page of PAGES) {
  const html = readFileSync(join(ROOT, page.file), 'utf8');
  const fail = (/** @type {string} */ why) => {
    failures.push(`${page.path}: ${why}`);
  };
  for (const element of page.holds) {
    if (!html.includes(element)) {
      fail(`${element}> is missing`);
    }
  }
  for (const element of page.lacks) {
    if (html.includes(element)) {
      fail(`${element}> should not be there`);
    }
  }
  const headings = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (headings !== 1) {
    fail(`${String(headings)} <h1>, one expected`);
  }
  if (!/<html[^>]*\slang="([a-z]+)"/.exec(html)?.[1]?.startsWith(page.lang)) {
    fail(`<html> does not say lang="${page.lang}"`);
  }
  if (!html.includes(`hreflang="${page.lang === 'fr' ? 'en' : 'fr'}"`)) {
    fail('the head links no other language');
  }
  if (page.lang === 'en' && /[àâçéèêëîïôûùœ]/i.test(wordsOf(html))) {
    fail('French words on an English page');
  }
}

if (sheets.length === 0) {
  failures.push('/projet/…: no sheet was prerendered');
}

if (failures.length > 0) {
  console.error(`check-prerender: ${String(failures.length)} failure(s)`);
  failures.forEach((failure) => {
    console.error(`  ${failure}`);
  });
  process.exit(1);
}

console.log(
  `check-prerender: ${String(PAGES.length)} pages hold what they should.`,
);
