import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavShellComponent } from './nav-shell.component';

const ITEMS = [
  { label: 'Accueil', route: '/' },
  { label: 'Projets', route: '/projets' },
];

describe('NavShellComponent', () => {
  const mount = async () => {
    TestBed.configureTestingModule({
      imports: [NavShellComponent],
      providers: [provideRouter([])],
    });

    const fixture = TestBed.createComponent(NavShellComponent);
    fixture.componentRef.setInput('brand', 'PM Marchio');
    fixture.componentRef.setInput('items', ITEMS);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  };

  it('lists one link per navigation item, in order', async () => {
    const host = await mount();
    const labels = Array.from(host.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(labels).toEqual(['Accueil', 'Projets']);
  });

  it('names its landmark, so a screen reader can jump to it', async () => {
    const host = await mount();

    expect(host.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Principale',
    );
  });

  it('leads home from the name it is given', async () => {
    const brand = (await mount()).querySelector<HTMLAnchorElement>('.brand');

    expect(brand?.textContent?.trim()).toBe('PM Marchio');
    expect(brand?.getAttribute('href')).toBe('/');
  });
});
