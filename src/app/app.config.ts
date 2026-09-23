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
import { ConsoleErrorHandlerService } from '@app/core/services';
import { RouteHeadStrategy } from '@app/core/strategies';
import { ProjectsEffect, ProjectsManager } from './features/projects/states';
import { DesktopEffect } from './features/desktop/states';
import { provideI18n } from './i18n';

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
    { provide: ErrorHandler, useClass: ConsoleErrorHandlerService },
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
    { provide: TitleStrategy, useClass: RouteHeadStrategy },
    // The pages are prerendered; hydration adopts that markup instead of
    // throwing it away and rendering the same thing again. Event replay is on
    // by default: a click made before the JavaScript arrives is replayed once
    // it does, which was checked in a browser rather than assumed.
    provideClientHydration(),
    provideStatewise({
      effects: [ProjectsEffect, DesktopEffect],
    }),

    // Both languages (D3): the texts of each layer, the links, and the
    // catalogue of the first address loaded before the first render.
    provideI18n(),

    // Awaited, so the prerendered HTML already holds the projects: the content
    // above the fold must exist without JavaScript.
    provideAppInitializer(async () => {
      await inject(ProjectsManager).load();
    }),
  ],
};
