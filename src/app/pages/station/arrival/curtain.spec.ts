import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { DesktopManager } from '@app/features/desktop/states';
import { Curtain } from './curtain';

const setUp = () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  TestBed.configureTestingModule({
    providers: [provideStatewise(), Curtain],
  });
  const station = TestBed.inject(DesktopManager);
  station.syncRoute('home');
  return { station, curtain: TestBed.inject(Curtain) };
};

describe('Curtain', () => {
  const SLUGS = ['a', 'b', 'c'];

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('waits 4200 ms, then lights each marker for 900 ms, then settles', () => {
    const { station, curtain } = setUp();
    curtain.play(() => SLUGS);

    vi.advanceTimersByTime(4199);
    expect(station.hovered()).toBeNull();

    vi.advanceTimersByTime(1);
    expect(station.hovered()).toBe('a');
    vi.advanceTimersByTime(900);
    expect(station.hovered()).toBe('b');
    vi.advanceTimersByTime(900);
    expect(station.hovered()).toBe('c');
    vi.advanceTimersByTime(900);
    expect(station.hovered()).toBeNull();
    vi.advanceTimersByTime(10_000);
    expect(station.hovered()).toBeNull();
  });

  it('stops for good once the reader points at something', () => {
    const { station, curtain } = setUp();
    curtain.play(() => SLUGS);
    vi.advanceTimersByTime(4200);

    curtain.takeOver();
    station.hover('mine');
    vi.advanceTimersByTime(5000);

    expect(station.hovered()).toBe('mine');
  });

  it('gives way to an open preview and to another view', () => {
    const { station, curtain } = setUp();
    curtain.play(() => SLUGS);

    station.openPreview('a');
    vi.advanceTimersByTime(4200);
    expect(station.hovered()).toBeNull();

    TestBed.resetTestingModule();
    const other = setUp();
    other.curtain.play(() => SLUGS);
    other.station.syncRoute('index');
    vi.advanceTimersByTime(4200);
    expect(other.station.hovered()).toBeNull();
  });

  it('stops when the station goes', () => {
    const { station, curtain } = setUp();
    curtain.play(() => SLUGS);

    TestBed.resetTestingModule();
    vi.advanceTimersByTime(10_000);

    expect(station.hovered()).toBeNull();
  });
});
