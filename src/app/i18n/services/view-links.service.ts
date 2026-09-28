import { computed, inject, Service } from '@angular/core';
import { LANGS } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import type { ObservatoryView } from '@app/features/observatory/models';
import { LanguageItem, NavigationItem } from '@shared/ui/models';
import { PAGES_TEXTS } from '../models/catalog.model';
import { pathOf, translatePath } from '../rules/paths.rules';

@Service()
export class ViewLinksService {
  private readonly locale = inject(LocaleService);
  private readonly texts = inject(PAGES_TEXTS);

  public readonly navigation = computed<readonly NavigationItem[]>(() => {
    const words = this.texts().navigation;
    const lang = this.locale.lang();
    return [
      { label: words.home, route: pathOf('home', lang) },
      { label: words.index, route: pathOf('index', lang) },
      { label: words.about, route: pathOf('about', lang) },
    ];
  });

  public readonly languages = computed<readonly LanguageItem[]>(() =>
    LANGS.map((lang) => ({
      code: lang.toUpperCase(),
      name: this.texts().languages[lang],
      lang,
      route: translatePath(this.locale.path(), lang),
      current: lang === this.locale.lang(),
    })),
  );

  public routeOf(view: ObservatoryView): string {
    return pathOf(
      view === 'home' || view === 'about' ? view : 'index',
      this.locale.lang(),
    );
  }
}
