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

const pageHeadLinks = (html: string): string[] =>
  [...html.matchAll(/<link\b[^>]*\bdata-page-head\b[^>]*>/g)].map(
    (match) => match[0],
  );

const attribute = (tag: string, name: string): string | undefined =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

const escapeXml = (text: string): string =>
  text
    .replaceAll('&amp;', '&')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const moveNotFoundPage = (directory: string): void => {
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

const prerenderedPages = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name === 'index.html')
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();

const sitemapEntry = (file: string): string => {
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
