import { inject } from '@angular/core';
import { RenderMode, type ServerRoute } from '@angular/ssr';
import { firstValueFrom } from 'rxjs';
import { LANGS, prefixedPath } from '@app/core/models';
import { PATHS } from '@app/i18n';
import { ProjectsRepositoryService } from './features/projects/services';

export const serverRoutes: ServerRoute[] = [
  ...LANGS.map((lang): ServerRoute => ({
    path: `${PATHS.sheet[lang]}/:slug`,
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const { projects } = await firstValueFrom(
        inject(ProjectsRepositoryService).getCatalog(),
      );

      return projects.map(({ slug }) => ({ slug }));
    },
  })),
  ...LANGS.map((lang): ServerRoute => ({
    path: prefixedPath(lang, '404'),
    renderMode: RenderMode.Prerender,
  })),
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
