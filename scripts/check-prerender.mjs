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
 * @property {string[]} holds  Elements the page must contain.
 * @property {string[]} lacks  Elements it must not.
 */

const sheets = readdirSync(join(ROOT, 'projet'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** @type {Page[]} */
const PAGES = [
  {
    path: '/',
    file: 'index.html',
    holds: ['<app-home-title', '<app-orbit-rule'],
    lacks: ['<app-window'],
  },
  {
    path: '/projets',
    file: 'projets/index.html',
    holds: ['<app-project-index'],
    lacks: ['<app-home-title'],
  },
  {
    path: '/a-propos',
    file: 'a-propos/index.html',
    holds: ['<app-about-window'],
    lacks: ['<app-home-title'],
  },
  ...sheets.map((slug) => ({
    path: `/projet/${slug}`,
    file: `projet/${slug}/index.html`,
    holds: ['<app-project-sheet'],
    lacks: ['<app-home-title', '<app-not-found-window'],
  })),
];

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
  if (!/<html[^>]*\slang="fr"/.test(html)) {
    fail('<html> does not say lang="fr"');
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
