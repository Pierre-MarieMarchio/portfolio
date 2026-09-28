import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryDockComponent } from './observatory-dock.component';
import { OBSERVATORY_TEXTS } from '../../ports';
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
    dock: TestBed.inject(OBSERVATORY_TEXTS)().dock,
  };
};

const entriesOf = (host: HTMLElement) =>
  [...host.querySelectorAll('a')].map((link) => ({
    text: link.textContent?.trim(),
    href: link.getAttribute('href'),
  }));

describe('ObservatoryDockComponent', () => {
  it('is a named, empty dock at first', async () => {
    const { host, dock } = await mount();

    expect(host.querySelector('nav')?.getAttribute('aria-label')).toBe(
      dock.label,
    );
    expect(entriesOf(host)).toEqual([]);
  });

  it('lists a pinned window the reader has left, with its way back', async () => {
    const { fixture, host, station, dock } = await mount();
    station.syncRoute('sheet', 'bkone');
    station.togglePin('sheet');
    station.syncRoute('index');
    station.togglePin('index');

    station.syncRoute('about');
    await fixture.whenStable();

    expect(entriesOf(host)).toEqual([
      { text: dock.windows.index, href: '/projets' },
      { text: dock.windows.sheet, href: '/projet/bkone' },
    ]);
  });

  it('sends a docked preview back to the home page', async () => {
    const { fixture, host, station, dock } = await mount();
    station.openPreview('bkone');
    station.togglePin('preview');

    station.syncRoute('index');
    await fixture.whenStable();

    expect(entriesOf(host)).toEqual([
      { text: dock.windows.preview, href: '/' },
    ]);
  });

  it('sends a docked about back to its own address', async () => {
    const { fixture, host, station, dock } = await mount();
    station.syncRoute('about');
    station.togglePin('about');

    station.syncRoute('index');
    await fixture.whenStable();

    expect(entriesOf(host)).toEqual([
      { text: dock.windows.about, href: '/a-propos' },
    ]);
  });
});
