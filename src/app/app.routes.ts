import { Routes } from '@angular/router';
import { AboutPageComponent } from './pages/about/about-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { NotFoundPageComponent } from './pages/not-found/not-found-page.component';
import { ProjectDetailPageComponent } from './pages/project-detail/project-detail-page.component';
import { projectTitle } from './pages/project-detail/project-title.resolver';
import { ProjectsPageComponent } from './pages/projects/projects-page.component';

/**
 * Each address names itself: the title strategy appends the site's name, and
 * `data.description` becomes the page's meta description.
 *
 * The routed components are markers, loaded eagerly: they tell the station
 * where the reader is, and the station renders the windows, so a pinned one
 * outlives a navigation. Eager, because the first client render must see the
 * view the server rendered, or hydration rebuilds the window.
 *
 * Paths rather than fragments: a fragment never reaches the server, so a
 * `#/projets` address could not be prerendered or indexed.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'Accueil',
    data: {
      description:
        'Portfolio de Pierre-Marie Marchio, concepteur développeur d’applications.',
    },
  },
  {
    path: 'projets',
    component: ProjectsPageComponent,
    title: 'Projets',
    data: { description: 'Les projets de Pierre-Marie Marchio.' },
  },
  {
    path: 'projet/:slug',
    component: ProjectDetailPageComponent,
    title: projectTitle,
  },
  {
    path: 'a-propos',
    component: AboutPageComponent,
    title: 'À propos',
    data: { description: 'Qui est Pierre-Marie Marchio.' },
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
    component: NotFoundPageComponent,
    title: 'Adresse inconnue',
  },
];
