export { PAGES_TEXTS } from './models/catalog.model';
export type { Catalog, PagesTexts, ViewHead } from './models/catalog.model';
export { CatalogLoaderService } from './services/catalog-loader.service';
export { PATHS } from './data/paths.data';
export type { AddressedView } from './data/paths.data';
export { pathOf, translatePath } from './rules/paths.rules';
export { loadCatalog } from './guards/catalog.guard';
export { provideI18n } from './providers/i18n.provider';
