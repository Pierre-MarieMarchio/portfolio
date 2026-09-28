import {
  afterRenderEffect,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MOBILE_NAV_PLATFORM } from '../../ports/mobile-nav-platform.port';
import { MOBILE_NAV_TEXTS } from '../../ports/mobile-nav-texts.port';
import { BackLayersService } from '../../services/back-layers.service';

type Phase = 'closed' | 'open' | 'leaving';

const ignore = (): void => {};

let menus = 0;

const nextMenu = (): number => {
  menus += 1;
  return menus;
};

@Component({
  selector: 'app-action-menu',
  templateUrl: './action-menu.component.html',
  styleUrl: './action-menu.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ActionMenuComponent {
  private readonly platform = inject(MOBILE_NAV_PLATFORM);
  private readonly backLayers = inject(BackLayersService);
  protected readonly texts = inject(MOBILE_NAV_TEXTS);

  public readonly heading = input.required<string>();
  public readonly open = model(false);

  protected readonly headingId = `action-menu-${String(nextMenu())}`;
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  private phase: Phase = 'closed';
  private opener: HTMLElement | null = null;
  private releaseBack: () => void = ignore;

  constructor() {
    afterRenderEffect(() => {
      const isOpen = this.open();
      untracked(() => {
        if (isOpen) {
          this.show();
        } else {
          this.dismiss();
        }
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.letGoOfBack();
    });
  }

  public dismiss(): void {
    if (this.phase !== 'open') {
      return;
    }
    this.phase = 'leaving';
    this.letGoOfBack();
    this.dialog().nativeElement.dataset['leaving'] = '';
    if (this.platform.reducedMotion()) {
      this.finish();
      return;
    }
    void this.platform.whenStill(this.panel().nativeElement).then(() => {
      this.finish();
    });
  }

  protected onCancel(event: Event): void {
    if (this.phase === 'closed' || !event.cancelable) {
      return;
    }
    event.preventDefault();
    this.dismiss();
  }

  protected onClose(): void {
    if (this.phase !== 'closed') {
      this.commit();
    }
  }

  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.dismiss();
    }
  }

  private show(): void {
    if (this.phase !== 'closed') {
      return;
    }
    const dialog = this.dialog().nativeElement;
    this.opener = dialog.ownerDocument.activeElement as HTMLElement | null;
    delete dialog.dataset['leaving'];
    dialog.showModal();
    this.phase = 'open';
    this.releaseBack = this.backLayers.push(() => {
      this.dismiss();
    });
  }

  private finish(): void {
    if (this.phase !== 'leaving') {
      return;
    }
    this.dialog().nativeElement.close();
    this.commit();
  }

  private commit(): void {
    this.phase = 'closed';
    delete this.dialog().nativeElement.dataset['leaving'];
    this.letGoOfBack();
    this.open.set(false);
    this.opener?.focus();
    this.opener = null;
  }

  private letGoOfBack(): void {
    const release = this.releaseBack;
    this.releaseBack = ignore;
    release();
  }
}
