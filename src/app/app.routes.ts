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
  unknownIn('en'),
  unknownIn('fr'),
];
