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
import { ObservatoryEffect } from './features/observatory/states';
import { provideI18n } from './i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: ConsoleErrorHandlerService },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      withViewTransitions({ skipInitialTransition: true }),
    ),
    { provide: TitleStrategy, useClass: RouteHeadStrategy },
    provideClientHydration(),
    provideStatewise({
      effects: [ProjectsEffect, ObservatoryEffect],
    }),

    provideI18n(),

    provideAppInitializer(async () => {
      await inject(ProjectsManager).load();
    }),
  ],
};
