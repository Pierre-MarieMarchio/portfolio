import { Routes } from '@angular/router';
import { ProjectDetailPageComponent } from './pages/project-detail/project-detail-page.component';
import { projectTitle } from './pages/project-detail/project-title.resolver';
import {
  ViewMarkerComponent,
  ViewMarkerData,
} from './pages/view-marker/view-marker.component';

/**
 * Each address names itself: the title strategy appends the site's name, and
 * `data.description` becomes the page's meta description.
 *
 * The routed components are markers (`ViewMarkerComponent`, told its view
 * by `data.view`, and the sheet's own), loaded eagerly: they tell the station
 * where the reader is, and the station renders the windows, so a pinned one
 * outlives a navigation. Eager, because the first client render must see the
 * view the server rendered, or hydration rebuilds the window.
 *
 * Paths rather than fragments: a fragment never reaches the server, so a
 * `#/projets` address could not be prerendered or indexed.
 */
/** A marked route's data: its view, and the description the head carries. */
type MarkedRoute = ViewMarkerData & { readonly description?: string };

export const routes: Routes = [
  {
    path: '',
    component: ViewMarkerComponent,
    title: 'Accueil',
    data: {
      view: 'home',
      description:
        'Portfolio de Pierre-Marie Marchio, concepteur développeur d’applications.',
    } satisfies MarkedRoute,
  },
  {
    path: 'projets',
    component: ViewMarkerComponent,
    title: 'Projets',
    data: {
      view: 'index',
      description: 'Les projets de Pierre-Marie Marchio.',
    } satisfies MarkedRoute,
  },
  {
    path: 'projet/:slug',
    component: ProjectDetailPageComponent,
    title: projectTitle,
  },
  {
    path: 'a-propos',
    component: ViewMarkerComponent,
    title: 'À propos',
    data: {
      view: 'about',
      description: 'Qui est Pierre-Marie Marchio.',
    } satisfies MarkedRoute,
  },
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
  {
    path: '**',
    component: ViewMarkerComponent,
    title: 'Adresse inconnue',
    data: { view: 'not-found' } satisfies MarkedRoute,
  },
];
