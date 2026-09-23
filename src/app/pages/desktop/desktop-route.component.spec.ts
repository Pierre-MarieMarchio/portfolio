import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { DesktopManager } from '@app/features/desktop/states';
import {
  DesktopRouteComponent,
  DesktopRouteData,
} from './desktop-route.component';

const mount = async (data: DesktopRouteData, slug: string | null = null) => {
  TestBed.configureTestingModule({
    imports: [DesktopRouteComponent],
    providers: [
      provideStatewise(),
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
  const fixture = TestBed.createComponent(DesktopRouteComponent);
  const station = TestBed.inject(DesktopManager);
  const declared = { view: station.view(), slug: station.slug() };
  fixture.componentRef.setInput('slug', slug);
  await fixture.whenStable();
  return { station, fixture, declared };
};

describe('DesktopRouteComponent', () => {
  it.each(['home', 'index', 'about', 'not-found'] as const)(
    'declares the %s view to the station as soon as it is created',
    async (view) => {
      const { declared } = await mount({ view });

      expect(declared).toEqual({ view, slug: null });
    },
  );

  it('declares the sheet to the station as soon as it is created', async () => {
    const { declared } = await mount({ view: 'sheet' }, 'ngx-statewise');

    expect(declared).toEqual({ view: 'sheet', slug: 'ngx-statewise' });
  });

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

  it('draws nothing', async () => {
    const { fixture } = await mount({ view: 'about' });

    expect((fixture.nativeElement as HTMLElement).childNodes).toHaveLength(0);
  });
});
