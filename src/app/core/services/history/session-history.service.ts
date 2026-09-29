import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, PLATFORM_ID, Service } from '@angular/core';
import { BrowserWindowService } from '../browser/browser-window.service';

interface CloseWatcherInstance {
  onclose: (() => void) | null;
  destroy: () => void;
}

type CloseWatcherClass = new () => CloseWatcherInstance;

const isCloseWatcherClass = (value: unknown): value is CloseWatcherClass =>
  typeof value === 'function';

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

  public watchClose(fn: () => void): () => void {
    const view = this.view();
    const watcher: unknown = view ? Reflect.get(view, 'CloseWatcher') : null;
    if (!isCloseWatcherClass(watcher)) {
      return () => {};
    }
    const watching = new watcher();
    watching.onclose = fn;
    return () => {
      watching.onclose = null;
      watching.destroy();
    };
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
