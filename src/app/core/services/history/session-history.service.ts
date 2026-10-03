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

  public push(state: unknown, address?: string): void {
    this.view()?.history.pushState(state, '', address);
  }

  public replace(address: string): void {
    this.view()?.history.replaceState(null, '', address);
  }

  public back(steps: number): void {
    this.view()?.history.go(-steps);
  }

  public position(): number | null {
    return this.view()?.navigation?.currentEntry?.index ?? null;
  }

  public backTo(parent: string): boolean {
    const position = this.position() ?? 0;
    const current = this.addressAt(position);
    let at = position;
    while (at-- > 0) {
      const address = this.addressAt(at);
      if (address === current) {
        continue;
      }
      if (address !== parent) {
        return false;
      }
      this.back(position - at);
      return true;
    }
    return false;
  }

  public addressAt(position: number): string | null {
    const url = this.view()?.navigation?.entries()[position]?.url;
    return url ? new URL(url).pathname : null;
  }

  public onPop(callback: (state: unknown) => void): () => void {
    return this.browserWindow.on('popstate', (event) => {
      callback(event.state);
    });
  }

  public hasCloseWatcher(): boolean {
    const view = this.view();
    return view ? 'CloseWatcher' in view : false;
  }

  public watchClose(callback: () => void): () => void {
    const view = this.view();
    const watcher: unknown = view ? Reflect.get(view, 'CloseWatcher') : null;
    if (!isCloseWatcherClass(watcher)) {
      return () => {};
    }
    const watching = new watcher();
    watching.onclose = callback;
    return () => {
      watching.onclose = null;
      watching.destroy();
    };
  }

  private view(): Window | null {
    return this.isBrowser ? this.document.defaultView : null;
  }
}
