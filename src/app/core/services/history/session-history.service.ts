import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';
import { BrowserWindowService } from '../browser/browser-window.service';

@Service()
export class SessionHistoryService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly browserWindow = inject(BrowserWindowService);

  public state(): unknown {
    return this.view()?.history.state ?? null;
  }

  public push(state: unknown): void {
    this.view()?.history.pushState(state, '');
  }

  public back(steps: number): void {
    this.view()?.history.go(-steps);
  }

  public onPop(fn: (state: unknown) => void): () => void {
    return this.browserWindow.on('popstate', (event) => {
      fn(event.state);
    });
  }

  public hasCloseWatcher(): boolean {
    const view = this.view();
    return view ? 'CloseWatcher' in view : false;
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
