import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PageBarComponent } from './page-bar.component';

const ITEMS = [
  { label: 'Accueil', route: '/' },
  { label: 'Projets', route: '/projets' },
];

describe('PageBarComponent', () => {
  const mount = async (current: string | null = null) => {
    TestBed.configureTestingModule({
      imports: [PageBarComponent],
      providers: [provideRouter([])],
    });

    const fixture = TestBed.createComponent(PageBarComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('current', current);
    await fixture.whenStable();

    return { fixture, host: fixture.nativeElement as HTMLElement };
  };

  it('lists one link per navigation item, in order', async () => {
    const { host } = await mount();
    const links = Array.from(host.querySelectorAll('nav a'));

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Accueil',
      'Projets',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/projets',
    ]);
  });

  /** A sheet lights "Projets" although its own address is another one. */
  it('marks the entry it is told is current, and only that one', async () => {
    const { host } = await mount('/projets');
    const current = host.querySelectorAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Projets');
  });

  it('asks for the English texts and says they are to come', async () => {
    const { fixture, host } = await mount();
    let asked = 0;
    fixture.componentInstance.englishRequested.subscribe(() => (asked += 1));

    host.querySelector<HTMLButtonElement>('.language button')?.click();
    expect(asked).toBe(1);
    expect(host.querySelector('[role="status"]')).toBeNull();

    fixture.componentRef.setInput('englishAsked', true);
    await fixture.whenStable();
    expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'textes anglais à venir',
    );
  });
});
