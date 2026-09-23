import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { StationManager } from '@app/features/station/states';
import { ProjectDetailPageComponent } from './project-detail-page.component';

describe('ProjectDetailPageComponent', () => {
  const mount = async (slug: string) => {
    TestBed.configureTestingModule({
      imports: [ProjectDetailPageComponent],
      providers: [
        provideStatewise(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ slug }) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(ProjectDetailPageComponent);
    const station = TestBed.inject(StationManager);
    const declared = { view: station.view(), slug: station.slug() };
    fixture.componentRef.setInput('slug', slug);
    await fixture.whenStable();

    return { fixture, station, declared };
  };

  /** Before any render: the station's first check already sees the sheet. */
  it('declares the sheet to the station as soon as it is created', async () => {
    const { declared } = await mount('ngx-statewise');

    expect(declared).toEqual({ view: 'sheet', slug: 'ngx-statewise' });
  });

  /** From one sheet to the next the outlet keeps the marker: the input moves. */
  it('follows the slug when the outlet reuses it for another sheet', async () => {
    const { fixture, station } = await mount('ngx-statewise');

    fixture.componentRef.setInput('slug', 'speakey');
    await fixture.whenStable();

    expect(station.slug()).toBe('speakey');
    expect(station.visited()).toEqual(['ngx-statewise', 'speakey']);
  });
});
