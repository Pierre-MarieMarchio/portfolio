import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  ɵwithDomHydration,
  ɵwithEventReplay,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { routes } from './app.routes';
import { ConsoleErrorHandlerService } from '@app/core/services';
import { RouteHeadStrategy } from '@app/core/strategies';
import { ProjectsEffect, ProjectsManager } from '@app/features/projects/states';
import { ObservatoryEffect } from '@app/features/observatory/states';
import { provideI18n } from '@app/i18n';

export const hydrationProviders = [ɵwithDomHydration(), ɵwithEventReplay()];

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
    ),
    { provide: TitleStrategy, useClass: RouteHeadStrategy },
    hydrationProviders,
    provideStatewise({
      effects: [ProjectsEffect, ObservatoryEffect],
    }),

    provideI18n(),

    provideAppInitializer(async () => {
      await inject(ProjectsManager).load();
    }),
  ],
};
