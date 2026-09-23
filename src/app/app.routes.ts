import { Route, Routes } from '@angular/router';
import { Lang, LANGS } from '@app/core/models';
import { loadCatalog, PATHS } from '@app/i18n';
import {
  alternates,
  sheetDescription,
  sheetTitle,
  viewDescription,
  viewTitle,
} from './pages/resolvers/page-head.resolver';
import {
  DesktopRouteComponent,
  DesktopRouteData,
} from './pages/desktop/desktop-route.component';

function routesIn(lang: Lang): Route[] {
  const viewRoute = (view: 'home' | 'index' | 'about'): Route => ({
    path: PATHS[view][lang],
    component: DesktopRouteComponent,
    canActivate: [loadCatalog],
    title: viewTitle(view),
    data: { view } satisfies DesktopRouteData,
    resolve: { description: viewDescription(view), alternates },
  });
  return [
    viewRoute('home'),
    viewRoute('index'),
    {
      path: `${PATHS.sheet[lang]}/:slug`,
      component: DesktopRouteComponent,
      canActivate: [loadCatalog],
      title: sheetTitle,
      data: { view: 'sheet' } satisfies DesktopRouteData,
      resolve: { description: sheetDescription, alternates },
    },
    viewRoute('about'),
  ];
}

function unknownIn(lang: Lang): Route {
  return {
    path: lang === 'en' ? 'en/**' : '**',
    component: DesktopRouteComponent,
    canActivate: [loadCatalog],
    title: viewTitle('notFound'),
    data: { view: 'not-found' } satisfies DesktopRouteData,
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
