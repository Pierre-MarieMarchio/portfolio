import { computed, inject, Injectable, signal } from '@angular/core';
import { Lang } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import { Catalog } from './catalog';

/** Each language's catalogue, as a chunk of its own: only the one read loads. */
const LOADERS: Readonly<Record<Lang, () => Promise<Catalog>>> = {
  fr: () => import('./fr').then((module) => module.FR),
  en: () => import('./en').then((module) => module.EN),
};

/**
 * The catalogues loaded so far, and the one of the reader's language. The
 * app initializer loads the language of the first address before the first
 * render, and every route loads its own before it activates
 * (`loadCatalog`), so `current` is never asked for one that is not there.
 */
@Injectable({ providedIn: 'root' })
export class Catalogs {
  private readonly locale = inject(LocaleService);
  private readonly loaded = signal<Partial<Record<Lang, Catalog>>>({});
  private readonly pending = new Map<Lang, Promise<void>>();

  public readonly current = computed<Catalog>(() => {
    const lang = this.locale.lang();
    const catalog = this.loaded()[lang];
    if (!catalog) {
      throw new Error(
        `The ${lang} catalogue was read before it was loaded: every route loads its own (loadCatalog).`,
      );
    }
    return catalog;
  });

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
