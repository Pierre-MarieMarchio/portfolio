import { Routes } from '@angular/router';

/**
 * Every page is loaded on navigation, and each one names itself: the title
 * strategy appends the site's name, and `data.description` becomes the page's
 * meta description.
 *
 * Paths rather than fragments: a fragment never reaches the server, so a
 * `#/projets` address could not be prerendered or indexed.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
    title: 'Accueil',
    data: {
      description:
        'Portfolio de Pierre-Marie Marchio, concepteur développeur d’applications.',
    },
  },
  {
    path: 'projets',
    loadComponent: () =>
      import('./pages/projects/projects-page.component').then(
        (m) => m.ProjectsPageComponent,
      ),
    title: 'Projets',
    data: { description: 'Les projets de Pierre-Marie Marchio.' },
  },
  {
    path: 'projet/:slug',
    loadComponent: () =>
      import('./pages/project-detail/project-detail-page.component').then(
        (m) => m.ProjectDetailPageComponent,
      ),
    title: 'Projet',
  },
  {
    path: 'a-propos',
    loadComponent: () =>
      import('./pages/about/about-page.component').then(
        (m) => m.AboutPageComponent,
      ),
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
    loadComponent: () =>
      import('./pages/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent,
      ),
    title: 'Adresse inconnue',
  },
];
