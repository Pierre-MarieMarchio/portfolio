import { inject } from '@angular/core';
import { RenderMode, type ServerRoute } from '@angular/ssr';
import { firstValueFrom } from 'rxjs';
import { ProjectsRepository } from './features/projects/services';

/**
 * Everything is prerendered: a portfolio is content, and a static host serves
 * it without a Node server to keep running. A route that one day needs a
 * request-time render gets `RenderMode.Server` here, and `outputMode` in
 * angular.json becomes `server`.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'projet/:slug',
    renderMode: RenderMode.Prerender,
    // One page per project, read from the same repository the pages use, so
    // a project added to the data is prerendered without touching this file.
    getPrerenderParams: async () => {
      const { projects } = await firstValueFrom(
        inject(ProjectsRepository).getCatalog(),
      );

      return projects.map(({ slug }) => ({ slug }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
