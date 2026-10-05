import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BackLayersService } from '../../services/back-layers.service';
import { provideRouter, Router } from '@angular/router';
import {
  ElementObserverService,
  MediaPreferencesService,
  SessionHistoryService,
} from '@app/core/services';
import { ActionMenuComponent } from './action-menu.component';
import { ActionRowDirective } from '../../directives/action-row.directive';
import { restoreDialogs, stubDialogs } from '@testing/doubles/browser.double';
import {
  ElementObserverDouble,
  MediaPreferencesDouble,
} from '@testing/doubles/browser-services.double';
import { HistoryStackDouble } from '@testing/doubles/session-history.double';
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
  const observer = new ElementObserverDouble();
  const media = new MediaPreferencesDouble();
  const history = new HistoryStackDouble();
  media.isReduced = isReduced;
  history.hasWatcher = hasCloseWatcher;
  TestBed.configureTestingModule({
    imports: [MenuHost],
    providers: [
      provideTexts(),
      BackLayersService,
      provideRouter([{ path: '**', children: [] }]),
      { provide: ElementObserverService, useValue: observer },
      { provide: MediaPreferencesService, useValue: media },
      { provide: SessionHistoryService, useValue: history },
    ],
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
    observer,
    history,
    leave: () => TestBed.inject(Router).navigateByUrl('/elsewhere'),
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
      await observer.settle();
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
    const { observer, close, closer, state, isShown, open, stable, settle } =
      await setup();
    await open();

    closer?.click();
    await stable();

    expect(observer.moving).toHaveLength(1);
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
    const { observer, close, closer, state, open, stable } = await setup({
      isReduced: true,
    });
    await open();

    closer?.click();
    await stable();

    expect(observer.moving).toEqual([]);
    expect(close).toHaveBeenCalledOnce();
    expect(state()).toBe(false);
  });

  it('closes on the back button before the view is left, where the browser has no close watcher', async () => {
    const { history, close, state, open, settle } = await setup();
    await open();

    expect(history.entries).toHaveLength(2);

    history.pressBack();
    await settle();

    expect(close).toHaveBeenCalledOnce();
    expect(state()).toBe(false);
    expect(history.backs).toEqual([]);
  });

  it('takes its history entry back when closed from the page', async () => {
    const { history, closer, open, settle } = await setup();
    await open();

    closer?.click();
    await settle();
    history.deliverPops();

    expect(history.backs).toEqual([1]);
    expect(history.place).toBe(0);
  });

  it('leaves the history alone where the browser sends the back button to the dialog', async () => {
    const { history, closer, open, settle } = await setup({
      hasCloseWatcher: true,
    });
    await open();

    closer?.click();
    await settle();

    expect(history.entries).toHaveLength(1);
    expect(history.backs).toEqual([]);
  });

  it('closes when the router leaves the view', async () => {
    const { history, leave, state, open, settle } = await setup();
    await open();

    await leave();
    await settle();

    expect(state()).toBe(false);
    expect(history.backs).toEqual([]);
  });
});
