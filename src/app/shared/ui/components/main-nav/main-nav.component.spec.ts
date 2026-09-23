import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { MainNavComponent } from './main-nav.component';

const ITEMS = [
  { label: 'Accueil', route: '/' },
  { label: 'Projets', route: '/projets' },
];

const mount = async (current: string | null = null) => {
  TestBed.configureTestingModule({
    imports: [MainNavComponent],
    providers: [provideRouter([]), provideTexts()],
  });

  const fixture = TestBed.createComponent(MainNavComponent);
  fixture.componentRef.setInput('items', ITEMS);
  fixture.componentRef.setInput('current', current);
  await fixture.whenStable();

  return { fixture, host: fixture.nativeElement as HTMLElement };
};

describe('MainNavComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

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
});
