import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionMenuComponent } from './action-menu.component';
import { ActionRowDirective } from '../../directives/action-row.directive';
import {
  MobileNavPlatformDouble,
  provideMobileNavPlatform,
} from '@testing/doubles/mobile-nav-platform.double';
import { restoreDialogs, stubDialogs } from '@testing/doubles/browser.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';

@Component({
  imports: [ActionMenuComponent, ActionRowDirective],
  template: `
    <button type="button" class="opener" (click)="open.set(true)">
      Ouvrir
    </button>
    <app-action-menu heading="Me contacter" [(open)]="open">
      <a appActionRow href="mailto:someone@example.com"
        ><svg aria-hidden="true"></svg><span>Écrire</span></a
      >
      <button type="button" appActionRow keepsOpen (click)="keep()">
        Garder
      </button>
    </app-action-menu>
  `,
})
class MenuHost {
  public readonly open = signal(false);
  public kept = 0;

  public keep(): void {
    this.kept += 1;
  }
}

const setup = async ({ isReduced = false, hasCloseWatcher = false } = {}) => {
  const dialogs = stubDialogs();
  const platform = new MobileNavPlatformDouble();
  platform.isReduced = isReduced;
  platform.hasCloseWatcher = hasCloseWatcher;
  TestBed.configureTestingModule({
    imports: [MenuHost],
    providers: [provideTexts(), provideMobileNavPlatform(platform)],
  });
  const fixture = TestBed.createComponent(MenuHost);
  const host = fixture.nativeElement as HTMLElement;
  document.body.append(host);
  await fixture.whenStable();
  const dialog = host.querySelector('dialog') as HTMLDialogElement;
  const opener = host.querySelector<HTMLButtonElement>('.opener');
  const rows = [...host.querySelectorAll<HTMLElement>('.action-row')];
  const closer = host.querySelector<HTMLButtonElement>('.action-menu-close');
  const stable = () => fixture.whenStable();
  return {
    ...dialogs,
    fixture,
    host,
    platform,
    dialog,
    rows,
    closer,
    stable,
    state: () => fixture.componentInstance.open(),
    isShown: () => dialog.hasAttribute('open'),
    open: async () => {
      opener?.focus();
      opener?.click();
      await stable();
    },
    settle: async () => {
      await platform.settle();
      await stable();
    },
  };
};

describe('ActionMenuComponent', () => {
  afterEach(() => {
    restoreDialogs();
    document.body.replaceChildren();
  });

  it('stays closed until asked, and never opens a dialog on its own', async () => {
    const { showModal, isShown, rows } = await setup();

    expect(showModal).not.toHaveBeenCalled();
    expect(isShown()).toBe(false);
    expect(rows).toHaveLength(2);
  });

  it('opens as a modal dialog named by its heading, with its rows and a named close button', async () => {
    const { showModal, dialog, rows, closer, open } = await setup();

    await open();

    expect(showModal).toHaveBeenCalledOnce();
    const heading = dialog.querySelector('h2');
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(heading?.textContent?.trim()).toBe('Me contacter');
    expect(closer?.textContent?.trim()).toBe('Fermer');
    expect(rows.map((row) => row.tagName)).toEqual(['A', 'BUTTON']);
    expect(rows.every((row) => dialog.contains(row))).toBe(true);
  });

  it('plays its exit before it closes, and says it is closed only once the exit is over', async () => {
    const { platform, close, closer, state, isShown, open, stable, settle } =
      await setup();
    await open();

    closer?.click();
    await stable();

    expect(platform.moving).toHaveLength(1);
    expect(close).not.toHaveBeenCalled();
    expect(isShown()).toBe(true);
    expect(state()).toBe(true);

    await settle();

    expect(close).toHaveBeenCalledOnce();
    expect(isShown()).toBe(false);
    expect(state()).toBe(false);
  });

  it('gives the focus back to what opened it', async () => {
    const { host, closer, open, settle } = await setup();
    await open();
    closer?.focus();

    closer?.click();
    await settle();

    expect(document.activeElement).toBe(host.querySelector('.opener'));
  });

  it('closes on Escape through the dialog cancel, and keeps Escape from the page', async () => {
    const { dialog, state, open, settle } = await setup();
    const heardByPage = vi.fn();
    document.addEventListener('keydown', heardByPage);
    await open();

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    await settle();
    document.removeEventListener('keydown', heardByPage);

    expect(heardByPage).not.toHaveBeenCalled();
    expect(cancel.defaultPrevented).toBe(true);
    expect(state()).toBe(false);
  });

  it('follows the browser when it closes the dialog without leave to wait', async () => {
    const { dialog, state, open, stable } = await setup();
    await open();

    const cancel = new Event('cancel', { cancelable: false });
    dialog.dispatchEvent(cancel);
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
    await stable();

    expect(state()).toBe(false);
  });

  it('closes on a tap beside the panel, not on a tap in it', async () => {
    const { dialog, state, open, settle } = await setup();
    await open();

    dialog.querySelector('h2')?.click();
    await settle();

    expect(state()).toBe(true);

    dialog.click();
    await settle();

    expect(state()).toBe(false);
  });

  it('closes once a row is chosen, unless the row keeps it open', async () => {
    const { fixture, rows, state, open, settle } = await setup();
    await open();
    const [link, kept] = rows;
    link?.addEventListener('click', (event) => {
      event.preventDefault();
    });

    kept?.click();
    await settle();

    expect(fixture.componentInstance.kept).toBe(1);
    expect(state()).toBe(true);

    link?.click();
    await settle();

    expect(state()).toBe(false);
  });

  it('closes when its owner sets it closed, after its exit', async () => {
    const { fixture, close, isShown, open, stable, settle } = await setup();
    await open();

    fixture.componentInstance.open.set(false);
    await stable();

    expect(isShown()).toBe(true);

    await settle();

    expect(close).toHaveBeenCalledOnce();
  });

  it('closes at once under reduced motion, with no exit to wait for', async () => {
    const { platform, close, closer, state, open, stable } = await setup({
      isReduced: true,
    });
    await open();

    closer?.click();
    await stable();

    expect(platform.moving).toEqual([]);
    expect(close).toHaveBeenCalledOnce();
    expect(state()).toBe(false);
  });

  it('closes on the back button before the view is left, where the browser has no close watcher', async () => {
    const { platform, close, state, open, settle } = await setup();
    await open();

    expect(platform.entries).toHaveLength(2);

    platform.pressBack();
    await settle();

    expect(close).toHaveBeenCalledOnce();
    expect(state()).toBe(false);
    expect(platform.backs).toEqual([]);
  });

  it('takes its history entry back when closed from the page', async () => {
    const { platform, closer, open, settle } = await setup();
    await open();

    closer?.click();
    await settle();
    platform.deliverPops();

    expect(platform.backs).toEqual([1]);
    expect(platform.place).toBe(0);
  });

  it('leaves the history alone where the browser sends the back button to the dialog', async () => {
    const { platform, closer, open, settle } = await setup({
      hasCloseWatcher: true,
    });
    await open();

    closer?.click();
    await settle();

    expect(platform.entries).toHaveLength(1);
    expect(platform.backs).toEqual([]);
  });

  it('closes when the router leaves the view', async () => {
    const { platform, state, open, settle } = await setup();
    await open();

    platform.leave();
    await settle();

    expect(state()).toBe(false);
    expect(platform.backs).toEqual([]);
  });
});
