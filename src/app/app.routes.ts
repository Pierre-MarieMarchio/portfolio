import { Route, Routes } from '@angular/router';
import { Lang, LANGS, prefixedPath } from '@app/core/models';
import {
  alternates,
  loadCatalog,
  PATHS,
  sheetDescription,
  sheetTitle,
  viewDescription,
  viewTitle,
} from '@app/i18n';
import {
  ObservatoryRouteComponent,
  ObservatoryRouteData,
} from './pages/observatory/observatory-route.component';

function routesIn(lang: Lang): Route[] {
  const viewRoute = (view: 'home' | 'index' | 'about'): Route => ({
    path: PATHS[view][lang],
    component: ObservatoryRouteComponent,
    canActivate: [loadCatalog],
    title: viewTitle(view),
    data: { view } satisfies ObservatoryRouteData,
    resolve: { description: viewDescription(view), alternates },
  });
  return [
    viewRoute('home'),
    viewRoute('index'),
    {
      path: `${PATHS.sheet[lang]}/:slug`,
      component: ObservatoryRouteComponent,
      canActivate: [loadCatalog],
      title: sheetTitle,
      data: { view: 'sheet' } satisfies ObservatoryRouteData,
      resolve: { description: sheetDescription, alternates },
    },
    viewRoute('about'),
  ];
}

function unknownAt(path: string): Route {
  return {
    path,
    component: ObservatoryRouteComponent,
    canActivate: [loadCatalog],
    title: viewTitle('notFound'),
    data: { view: 'not-found' } satisfies ObservatoryRouteData,
    resolve: { alternates },
  };
}

function unknownPathsUnder(leaf: string): string[] {
  return LANGS.map((lang) => prefixedPath(lang, leaf)).sort(
    (a, b) => b.length - a.length,
  );
}

export const routes: Routes = [
  ...LANGS.flatMap((lang) => routesIn(lang)),
  ...[...unknownPathsUnder('404'), ...unknownPathsUnder('**')].map((path) =>
    unknownAt(path),
  ),
];
