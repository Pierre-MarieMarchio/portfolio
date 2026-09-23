import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { langOfUrl } from '@app/core/models';
import { CatalogLoaderService } from '../services/catalog-loader.service';

export const loadCatalog: CanActivateFn = (_route, state) =>
  inject(CatalogLoaderService)
    .ensure(langOfUrl(state.url))
    .then(() => true);
