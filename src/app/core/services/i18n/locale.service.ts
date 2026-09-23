import { Location } from '@angular/common';
import { computed, DOCUMENT, effect, inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { langOfUrl } from '../../models/lang.model';

@Service()
export class LocaleService {
  private readonly router = inject(Router);
  private readonly loadedPath = inject(Location).path() || '/';

  public readonly path = computed(() => {
    const finalUrl = this.router.lastSuccessfulNavigation()?.finalUrl;
    return finalUrl ? this.router.serializeUrl(finalUrl) : this.loadedPath;
  });
  public readonly lang = computed(() => langOfUrl(this.path()));

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    effect(() => {
      root.setAttribute('lang', this.lang());
    });
  }
}
