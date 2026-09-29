import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { WINDOW_FOLD, WindowFold } from '@shared/windows/ports';
import { HomeTitleComponent } from './home-title.component';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [HomeTitleComponent],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(HomeTitleComponent);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

const foldOf = () => {
  const isFolded = signal(false);
  const held: HTMLElement[] = [];
  const released: HTMLElement[] = [];
  const toggle = vi.fn(() => {
    isFolded.update((folded) => !folded);
  });
  const fold: WindowFold = {
    isActive: () => true,
    isFolded: () => isFolded(),
    toggle,
    hold: (handle) => {
      held.push(handle);
      return () => {
        released.push(handle);
      };
    },
  };
  return { fold, isFolded, held, released, toggle };
};

const mountOnPhone = async () => {
  stubMedia(TOUCH);
  resizeTo(412, 915);
  const { fold, ...rest } = foldOf();
  TestBed.configureTestingModule({
    imports: [HomeTitleComponent],
    providers: [provideTexts(), { provide: WINDOW_FOLD, useValue: fold }],
  });
  const fixture = TestBed.createComponent(HomeTitleComponent);
  await fixture.whenStable();
  return { fixture, host: fixture.nativeElement as HTMLElement, ...rest };
};

describe('HomeTitleComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says where the search stands, in a paragraph right under the h1', async () => {
    const host = await mount();
    const status = host.querySelector('h1 + p.status');

    expect(status?.textContent?.trim()).toBe(
      'Je cherche le prochain projet à construire.',
    );
    expect(host.querySelectorAll('h1, h2, h3')).toHaveLength(1);
  });

  it('is drawn on two lines on the desktop, with no handle', async () => {
    const host = await mount();

    expect(host.querySelector('.name')?.textContent?.trim()).toBe(
      'Pierre-Marie Marchio',
    );
    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'Développeur .NET et Angular',
    );
    expect(host.querySelector('.bar')).toBeNull();
    expect(host.querySelector('button')).toBeNull();
  });

  describe('on the phone, as the handle line of the home sheet', () => {
    it('is one line, made of the name and the trade already on the page, in a single h1', async () => {
      const { host } = await mountOnPhone();

      expect(host.querySelectorAll('h1')).toHaveLength(1);
      expect(host.querySelector('h1')?.textContent?.trim()).toBe(
        'Pierre-Marie Marchio · Développeur .NET et Angular',
      );
      expect(host.querySelector('.name')).toBeNull();
      expect(host.querySelector('.status')).toBeNull();
    });

    it('keeps the id the scene section is labelled by', async () => {
      const { host } = await mountOnPhone();

      expect(host.querySelector('h1')?.id).toBe('home-title');
    });

    it('hands its bar to the sheet as the handle, and lets it go when it leaves', async () => {
      const { fixture, host, held, released } = await mountOnPhone();

      expect(held).toEqual([host.querySelector('.bar')]);
      expect(released).toEqual([]);

      fixture.destroy();
      expect(released).toEqual(held);
    });

    it('carries the same handle as the other sheets, and no chevron', async () => {
      const { host } = await mountOnPhone();

      expect(host.querySelectorAll('button')).toHaveLength(1);
      expect(host.querySelector('.bar button.grip')).not.toBeNull();
      expect(host.querySelector('.fold, svg')).toBeNull();
    });

    it('folds and unfolds the sheet from its handle, named for what it will do', async () => {
      const { fixture, host, toggle, isFolded } = await mountOnPhone();
      const grip = host.querySelector<HTMLButtonElement>('button.grip');

      expect(isFolded()).toBe(false);
      expect(grip?.getAttribute('aria-label')).toBe('Baisser la fenêtre');
      expect(grip?.getAttribute('aria-expanded')).toBe('true');

      grip?.click();
      await fixture.whenStable();

      expect(toggle).toHaveBeenCalledOnce();
      expect(isFolded()).toBe(true);
      expect(grip?.getAttribute('aria-label')).toBe('Remonter la fenêtre');
      expect(grip?.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
