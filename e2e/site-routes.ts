import { readdirSync } from 'node:fs';

export type SiteRoute = {
  readonly name: string;
  readonly path: string;
};

type Addresses = {
  readonly lang: 'fr' | 'en';
  readonly home: string;
  readonly index: string;
  readonly about: string;
  readonly sheet: string;
  readonly unknown: string;
};

const SHEETS = readdirSync('dist/portfolio/browser/projet', {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (SHEETS.length === 0) {
  throw new Error(
    'e2e: dist/portfolio/browser/projet holds no sheet; run npm run build first.',
  );
}

const routesIn = (at: Addresses): SiteRoute[] => [
  { name: `${at.lang}-home`, path: at.home },
  { name: `${at.lang}-index`, path: at.index },
  ...SHEETS.map((slug) => ({
    name: `${at.lang}-sheet-${slug}`,
    path: `${at.sheet}/${slug}`,
  })),
  { name: `${at.lang}-about`, path: at.about },
  { name: `${at.lang}-unknown`, path: at.unknown },
];

export const SITE_ROUTES: readonly SiteRoute[] = [
  ...routesIn({
    lang: 'fr',
    home: '/',
    index: '/projets',
    about: '/a-propos',
    sheet: '/projet',
    unknown: '/nulle-part',
  }),
  ...routesIn({
    lang: 'en',
    home: '/en',
    index: '/en/projects',
    about: '/en/about',
    sheet: '/en/project',
    unknown: '/en/nowhere',
  }),
];
