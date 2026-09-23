import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import {
  stationEscaped,
  stationPreviewClosed,
  stationSelected,
  stationVoidClicked,
  stationWindowClosed,
} from './station.action';
import { StationState } from './station.state';

/**
 * The station's way back. Every step is one notch, never more: selection →
 * overview, sheet and unknown address → index, index and about → home,
 * preview → closed. Never a dead end.
 *
 * The router lives here, at the boundary: the updater only records where
 * the reader is, and a navigation it caused comes back as `navigated`.
 */
@Injectable({ providedIn: 'root' })
export class StationEffect {
  private readonly router = inject(Router);
  private readonly state = inject(StationState);

  public readonly closeEffect = createEffect(stationWindowClosed, (window) => {
    const view = this.state.view();
    if (window === 'index' && view === 'index') {
      return this.go('/');
    }
    if (window === 'about' && view === 'about') {
      return this.go('/');
    }
    if (window === 'sheet' && (view === 'sheet' || view === 'not-found')) {
      return this.go('/projets');
    }
    return undefined;
  });

  public readonly escapeEffect = createEffect(stationEscaped, () => {
    const view = this.state.view();
    if (view === 'index' && this.state.selection() !== null) {
      return stationSelected(null);
    }
    if (view === 'sheet' || view === 'not-found') {
      return this.go('/projets');
    }
    if (view === 'index' || view === 'about') {
      return this.go('/');
    }
    return this.state.preview() !== null ? stationPreviewClosed() : undefined;
  });

  public readonly voidEffect = createEffect(stationVoidClicked, () => {
    const view = this.state.view();
    if (view === 'sheet') {
      return this.go('/projets');
    }
    if (view === 'index' && this.state.selection() !== null) {
      return stationSelected(null);
    }
    return this.state.preview() !== null ? stationPreviewClosed() : undefined;
  });

  private async go(url: string): Promise<undefined> {
    await this.router.navigateByUrl(url);
    return undefined;
  }
}
