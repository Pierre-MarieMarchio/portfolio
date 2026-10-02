// @ts-check
/**
 * What the build leaves to do once Angular has prerendered the site.
 *
 * The not-found pages are prerendered at /404 and /en/404, the only way the
 * prerender writes a page for an address that is not a real route. They move
 * to 404.html and en/404.html, where the web server's error document points,
 * and are marked noindex. The sitemap and robots.txt are then written from
 * the pages' own head, which already carries the absolute address and the
 * other-language links built from SITE_URL.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const ROOT = 'dist/portfolio/browser';
const NOT_FOUND_PAGES = ['404', 'en/404'];

/**
 * @param {string} html
 * @returns {string[]}
 */
const pageHeadLinks = (html) =>
  [...html.matchAll(/<link\b[^>]*\bdata-page-head\b[^>]*>/g)].map(
    (match) => match[0],
  );

/**
 * @param {string} tag
 * @param {string} name
 */
const attribute = (tag, name) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

/** @param {string} text */
const escapeXml = (text) =>
  text
    .replaceAll('&amp;', '&')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/** @param {string} directory */
const moveNotFoundPage = (directory) => {
  const source = join(ROOT, directory, 'index.html');
  if (!existsSync(source)) {
    throw new Error(`${source} was not prerendered`);
  }
  const html = readFileSync(source, 'utf8')
    .replace(/<link\b[^>]*\bdata-page-head\b[^>]*>\s*/g, '')
    .replace('<head>', '<head><meta name="robots" content="noindex">');
  writeFileSync(`${join(ROOT, directory)}.html`, html);
  rmSync(join(ROOT, directory), { recursive: true });
};

/**
 * @param {string} directory
 * @returns {string[]}
 */
const prerenderedPages = (directory) =>
  readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name === 'index.html')
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();

/** @param {string} file */
const sitemapEntry = (file) => {
  const links = pageHeadLinks(readFileSync(file, 'utf8'));
  const canonical = links
    .filter((link) => attribute(link, 'rel') === 'canonical')
    .map((link) => attribute(link, 'href'))[0];
  if (canonical === undefined) {
    throw new Error(`${file} has no canonical link`);
  }
  const alternates = links
    .filter((link) => attribute(link, 'rel') === 'alternate')
    .map(
      (link) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(attribute(link, 'hreflang') ?? '')}" href="${escapeXml(attribute(link, 'href') ?? '')}"/>`,
    );
  return [
    '  <url>',
    `    <loc>${escapeXml(canonical)}</loc>`,
    ...alternates,
    '  </url>',
  ].join('\n');
};

for (const directory of NOT_FOUND_PAGES) {
  moveNotFoundPage(directory);
}

const pages = prerenderedPages(ROOT);
const home = pageHeadLinks(readFileSync(join(ROOT, 'index.html'), 'utf8'))
  .filter((link) => attribute(link, 'rel') === 'canonical')
  .map((link) => attribute(link, 'href'))[0];
if (home === undefined) {
  throw new Error('the home page has no canonical link');
}

writeFileSync(
  join(ROOT, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...pages.map(sitemapEntry),
    '</urlset>',
    '',
  ].join('\n'),
);
writeFileSync(
  join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${home.replace(/\/$/, '')}/sitemap.xml\n`,
);

console.log(
  `finish-build: ${String(NOT_FOUND_PAGES.length)} not-found pages, ${String(pages.length)} pages in the sitemap.`,
);
