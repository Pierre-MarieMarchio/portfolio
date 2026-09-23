import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { DesktopManager } from '@app/features/desktop/states';
import {
  DesktopRouteComponent,
  ViewMarkerData,
} from './desktop-route.component';

const mount = (data: ViewMarkerData) => {
  TestBed.configureTestingModule({
    imports: [DesktopRouteComponent],
    providers: [
      provideStatewise(),
      { provide: ActivatedRoute, useValue: { snapshot: { data } } },
    ],
  });
  const station = TestBed.inject(DesktopManager);
  const fixture = TestBed.createComponent(DesktopRouteComponent);
  return { station, fixture };
};

describe('ViewMarkerComponent', () => {
  /** Before any render: the station's first check already sees the view. */
  it.each(['home', 'index', 'about', 'not-found'] as const)(
    'declares the %s view to the station as soon as it is created',
    (view) => {
      const { station } = mount({ view });

      expect(station.view()).toBe(view);
    },
  );

  it('draws nothing', () => {
    const { fixture } = mount({ view: 'about' });

    expect((fixture.nativeElement as HTMLElement).childNodes).toHaveLength(0);
  });
});
