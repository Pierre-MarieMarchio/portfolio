import { Route, Routes } from '@angular/router';
import { Lang, LANGS } from '@app/core/models';
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

export const routes: Routes = [
  ...LANGS.flatMap((lang) => routesIn(lang)),
  unknownAt('en/404'),
  unknownAt('404'),
  unknownAt('en/**'),
  unknownAt('**'),
];
