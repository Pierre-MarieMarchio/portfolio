import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryDockComponent } from './observatory-dock.component';
import { ObservatoryManager } from '../../states';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [ObservatoryDockComponent],
    providers: [provideTexts(), provideRouter([]), provideStatewise()],
  });
  const fixture = TestBed.createComponent(ObservatoryDockComponent);
  await fixture.whenStable();
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    station: TestBed.inject(ObservatoryManager),
  };
};

const entriesOf = (host: HTMLElement) =>
  [...host.querySelectorAll('a')].map((link) => ({
    text: link.textContent?.trim(),
    href: link.getAttribute('href'),
  }));

describe('ObservatoryDockComponent', () => {
  it('is a named, empty dock at first', async () => {
    const { host } = await mount();

    const dock = host.querySelector('nav');
    expect(dock?.getAttribute('aria-label')).toBe('Fenêtres rangées');
    expect(entriesOf(host)).toEqual([]);
  });

  it('lists a pinned window the reader has left, with its way back', async () => {
    const { fixture, host, station } = await mount();
    station.syncRoute('sheet', 'bkone');
    station.togglePin('sheet');
    station.syncRoute('index');
    station.togglePin('index');

    station.syncRoute('about');
    await fixture.whenStable();

    expect(entriesOf(host)).toEqual([
      { text: 'Projets', href: '/projets' },
      { text: 'Fiche', href: '/projet/bkone' },
    ]);
  });

  it('sends a docked preview back to the home page', async () => {
    const { fixture, host, station } = await mount();
    station.openPreview('bkone');
    station.togglePin('preview');

    station.syncRoute('index');
    await fixture.whenStable();

    expect(entriesOf(host)).toEqual([{ text: 'Aperçu', href: '/' }]);
  });
});
