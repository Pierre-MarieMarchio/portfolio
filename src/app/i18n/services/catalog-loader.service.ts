import { computed, inject, Service, signal } from '@angular/core';
import { Lang } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import { Catalog } from '../models/catalog.model';

const LOADERS: Readonly<Record<Lang, () => Promise<Catalog>>> = {
  fr: () => import('../data/fr.data').then((module) => module.FR),
  en: () => import('../data/en.data').then((module) => module.EN),
};

@Service()
export class CatalogLoaderService {
  private readonly locale = inject(LocaleService);
  private readonly loaded = signal<Partial<Record<Lang, Catalog>>>({});
  private readonly pending = new Map<Lang, Promise<void>>();

  public readonly current = computed<Catalog>(() =>
    this.of(this.locale.lang()),
  );

  public of(lang: Lang): Catalog {
    const catalog = this.loaded()[lang];
    if (!catalog) {
      throw new Error(
        `The ${lang} catalogue was read before it was loaded: every route loads its own (loadCatalog).`,
      );
    }
    return catalog;
  }

  public ensure(lang: Lang): Promise<void> {
    if (this.loaded()[lang]) {
      return Promise.resolve();
    }
    let loading = this.pending.get(lang);
    if (!loading) {
      loading = LOADERS[lang]().then((catalog) => {
        this.loaded.update((loaded) => ({ ...loaded, [lang]: catalog }));
      });
      this.pending.set(lang, loading);
    }
    return loading;
  }
}
