import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryManager } from '@app/features/observatory/states';
import {
  ObservatoryRouteComponent,
  ObservatoryRouteData,
} from './observatory-route.component';

const mount = async (
  data: ObservatoryRouteData,
  slug: string | null = null,
  { navigated = false } = {},
) => {
  TestBed.configureTestingModule({
    imports: [ObservatoryRouteComponent],
    providers: [
      provideStatewise(),
      { provide: Router, useValue: { navigated } },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data,
            paramMap: convertToParamMap(slug === null ? {} : { slug }),
          },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ObservatoryRouteComponent);
  const station = TestBed.inject(ObservatoryManager);
  const declared = { view: station.view(), slug: station.slug() };
  fixture.componentRef.setInput('slug', slug);
  await fixture.whenStable();
  return { station, fixture, declared };
};

describe('ObservatoryRouteComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['home', null],
    ['index', null],
    ['about', null],
    ['not-found', null],
    ['sheet', 'ngx-statewise'],
  ] as const)(
    'declares the %s view to the observatory as soon as it is created',
    async (view, slug) => {
      const { declared } = await mount({ view }, slug);

      expect(declared).toEqual({ view, slug });
    },
  );

  it('follows the slug when the outlet reuses it for another sheet', async () => {
    const { fixture, station } = await mount(
      { view: 'sheet' },
      'ngx-statewise',
    );

    fixture.componentRef.setInput('slug', 'speakey');
    await fixture.whenStable();

    expect(station.slug()).toBe('speakey');
    expect(station.visited()).toEqual(['ngx-statewise', 'speakey']);
  });

  it('declares the view of a later navigation on the next frame, apart from the router work', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => {
      frames.push(fn);
      return frames.length;
    });
    const { station, declared } = await mount({ view: 'sheet' }, 'speakey', {
      navigated: true,
    });
    expect(declared).toEqual({ view: 'home', slug: null });
    expect(station.view()).toBe('home');

    for (const frame of frames.splice(0)) {
      frame(0);
    }

    expect([station.view(), station.slug()]).toEqual(['sheet', 'speakey']);
  });

  it('draws nothing', async () => {
    const { fixture } = await mount({ view: 'about' });

    expect((fixture.nativeElement as HTMLElement).childNodes).toHaveLength(0);
  });
});
