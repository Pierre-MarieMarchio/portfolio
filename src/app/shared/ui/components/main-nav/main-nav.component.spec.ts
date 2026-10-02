import { TestBed } from '@angular/core/testing';
import { recordOutput } from '@testing/fixtures/testbed.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { MainNavComponent } from './main-nav.component';

const ITEMS = [
  { label: 'Accueil', route: '/' },
  { label: 'Projets', route: '/projets' },
];

const mount = async (
  current: string | null = null,
  openRoutes: readonly string[] = [],
) => {
  TestBed.configureTestingModule({
    imports: [MainNavComponent],
    providers: [provideTexts()],
  });

  const fixture = TestBed.createComponent(MainNavComponent);
  fixture.componentRef.setInput('items', ITEMS);
  fixture.componentRef.setInput('current', current);
  fixture.componentRef.setInput('openRoutes', openRoutes);
  await fixture.whenStable();

  return { fixture, host: fixture.nativeElement as HTMLElement };
};

describe('MainNavComponent', () => {
  it('lists one link per navigation item, in order', async () => {
    const { host } = await mount();
    const links = [...host.querySelectorAll('nav a')];

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Accueil',
      'Projets',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/projets',
    ]);
  });

  it('marks the entry it is told is current, and only that one', async () => {
    const { host } = await mount('/projets');
    const current = host.querySelectorAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Projets');
  });

  it('moves the focus to the entry of a route, and to no other', async () => {
    const { fixture, host } = await mount();

    fixture.componentInstance.focusRoute('/projets');

    expect(document.activeElement).toBe(
      host.querySelector('a[href="/projets"]'),
    );

    fixture.componentInstance.focusRoute('/nowhere');

    expect(document.activeElement).toBe(
      host.querySelector('a[href="/projets"]'),
    );
  });

  it('names its navigation in the reader language', async () => {
    const { host } = await mount();

    expect(host.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Navigation principale',
    );
  });

  it('says where its entrance stands, timed until told otherwise', async () => {
    const { fixture, host } = await mount();

    expect(host.dataset['arrival']).toBe('timed');

    fixture.componentRef.setInput('arrival', 'held');
    await fixture.whenStable();

    expect(host.dataset['arrival']).toBe('held');
  });

  it('marks the entries it is told are open, and only those', async () => {
    const { host } = await mount(null, ['/projets']);
    const links = [...host.querySelectorAll<HTMLElement>('nav a')];

    expect(links.map((link) => link.dataset['open'] !== undefined)).toEqual([
      false,
      true,
    ]);
  });

  it('says an open entry keeps its window open, without touching what shows', async () => {
    const { host } = await mount(null, ['/projets']);
    const [home, projects] = [...host.querySelectorAll('nav a')];

    expect(home?.getAttribute('aria-label')).toBeNull();
    expect(projects?.getAttribute('aria-label')).toBe(
      'Projets, fenêtre ouverte',
    );
    expect(projects?.textContent?.trim()).toBe('Projets');
  });

  it('keeps the current entry marked current even once its window counts as open', async () => {
    const { host } = await mount('/projets', ['/projets']);
    const projects = host.querySelector<HTMLElement>('[aria-current="page"]');

    expect(projects?.dataset['open']).toBe('');
    expect(projects?.getAttribute('aria-label')).toBe(
      'Projets, fenêtre ouverte',
    );
  });

  it('says which entry was touched, the current one included, and does not follow the link', async () => {
    const { fixture, host } = await mount('/projets');
    const chosen = recordOutput(fixture.componentInstance.chosen);
    const [home, projects] = [...host.querySelectorAll<HTMLElement>('nav a')];
    const touches = [home, projects].map(
      () => new MouseEvent('click', { bubbles: true, cancelable: true }),
    );

    home?.dispatchEvent(touches[0] as Event);
    projects?.dispatchEvent(touches[1] as Event);

    expect(chosen).toEqual(['/', '/projets']);
    expect(touches.map((touch) => touch.defaultPrevented)).toEqual([
      true,
      true,
    ]);
  });

  it('leaves a touch with a modifier key to the browser, and says nothing', async () => {
    const { fixture, host } = await mount('/projets');
    const chosen = recordOutput(fixture.componentInstance.chosen);
    const touch = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });

    host.querySelector('nav a')?.dispatchEvent(touch);

    expect(chosen).toEqual([]);
    expect(touch.defaultPrevented).toBe(false);
  });
});
