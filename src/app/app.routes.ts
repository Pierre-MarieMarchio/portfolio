import { Route, Routes } from '@angular/router';
import { Lang, LANGS } from '@app/core/models';
import { loadCatalog, PATHS } from '@app/i18n';
import { ProjectDetailRouteComponent } from './pages/desktop/project-detail-route.component';
import {
  projectDescription,
  projectTitle,
} from './pages/resolvers/project-title.resolver';
import {
  alternates,
  headDescription,
  headTitle,
} from './pages/resolvers/view-head.resolver';
import {
  DesktopRouteComponent,
  ViewMarkerData,
} from './pages/desktop/desktop-route.component';

/**
 * Each address names itself: the title strategy appends the site's name, and
 * `data.description` becomes the page's meta description, both read from the
 * catalogue of the address's language.
 *
 * The routed components are markers (`ViewMarkerComponent`, told its view
 * by `data.view`, and the sheet's own), loaded eagerly: they tell the station
 * where the reader is, and the station renders the windows, so a pinned one
 * outlives a navigation. Eager, because the first client render must see the
 * view the server rendered, or hydration rebuilds the window.
 *
 * Paths rather than fragments: a fragment never reaches the server, so a
 * `#/projets` address could not be prerendered or indexed. Every address
 * exists in each language (D4), generated here from the one table of paths.
 */
function routesIn(lang: Lang): Route[] {
  const marked = (view: 'home' | 'index' | 'about'): Route => ({
    path: PATHS[view][lang],
    component: DesktopRouteComponent,
    canActivate: [loadCatalog],
    title: headTitle(view),
    data: { view } satisfies ViewMarkerData,
    resolve: { description: headDescription(view), alternates },
  });
  return [
    marked('home'),
    marked('index'),
    {
      path: `${PATHS.sheet[lang]}/:slug`,
      component: ProjectDetailRouteComponent,
      canActivate: [loadCatalog],
      title: projectTitle,
      resolve: { description: projectDescription, alternates },
    },
    marked('about'),
  ];
}

/** An address no view claims, in the language it was asked in. */
function unknownIn(lang: Lang): Route {
  return {
    path: lang === 'en' ? 'en/**' : '**',
    component: DesktopRouteComponent,
    canActivate: [loadCatalog],
    title: headTitle('notFound'),
    data: { view: 'not-found' } satisfies ViewMarkerData,
    resolve: { alternates },
  };
}

export const routes: Routes = [
  ...LANGS.flatMap((lang) => routesIn(lang)),
  // The shared-component bench exists in development builds only. The
  // condition reads `ngDevMode` itself rather than `isDevMode()`: the
  // production build defines it as `false`, so the minifier drops the branch
  // and the bench's chunk with it, where a function call would keep both.
  ...(typeof ngDevMode === 'undefined' || ngDevMode
    ? [
        {
          path: 'atelier',
          loadComponent: () =>
            import('./pages/workbench/workbench-page.component').then(
              (m) => m.WorkbenchPageComponent,
            ),
          title: 'Atelier',
        },
      ]
    : []),
  // English first: `**` would catch `/en/…` as well.
  unknownIn('en'),
  unknownIn('fr'),
];
