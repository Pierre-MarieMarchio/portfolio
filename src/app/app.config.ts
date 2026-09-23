import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { routes } from './app.routes';
import { AppErrorHandler } from './core/error-handling';
import { PageTitleStrategy } from './core/services';
import { ProjectsEffect, ProjectsManager } from './features/projects/states';
import { StationEffect } from './features/station/states';

/**
 * The composition root: the only place the library is configured, ports are
 * wired and the initial state is loaded.
 *
 * Zoneless: no `zone.js` polyfill, and change detection runs only when a
 * signal read by a template changes (or an event bound in one fires). It is
 * Angular's default since version 21; it is written out anyway, so adding
 * zone.js by accident cannot switch the application back without this line
 * saying otherwise. src/integration/zoneless.spec.ts holds it.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    // The one channel every failure reaches, the library's included.
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideRouter(
      routes,
      // Route parameters arrive as component inputs: a page declares
      // `slug = input.required<string>()` instead of reading ActivatedRoute.
      withComponentInputBinding(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      // The first render is skipped: a prerendered page is already there, and
      // animating it in would undo the point of prerendering it.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    // The pages are prerendered; hydration adopts that markup instead of
    // throwing it away and rendering the same thing again. Event replay is on
    // by default: a click made before the JavaScript arrives is replayed once
    // it does, which was checked in a browser rather than assumed.
    provideClientHydration(),
    provideStatewise({
      effects: [ProjectsEffect, StationEffect],
    }),

    // Awaited, so the prerendered HTML already holds the projects: the content
    // above the fold must exist without JavaScript.
    provideAppInitializer(async () => {
      await inject(ProjectsManager).load();
    }),
  ],
};
