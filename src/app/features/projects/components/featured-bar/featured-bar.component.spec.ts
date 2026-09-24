import { TestBed } from '@angular/core/testing';
import { LayoutAnchorsService } from '@shared/ui/services';
import { provideRouter } from '@angular/router';
import { sampleEntry, sampleRanked } from '@testing/fixtures/project.fixture';
import { RankedProject } from '../../models';
import { FeaturedBarComponent } from './featured-bar.component';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const markerButtons = (host: HTMLElement): HTMLButtonElement[] => [
  ...host.querySelectorAll<HTMLButtonElement>('button'),
];

const stubTrackWidth = (width: number) =>
  vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ width } as DOMRect);

describe('OrbitRuleComponent', () => {
  const entries = [
    ['alpha', 'Alpha', 'Alp'],
    ['beta', 'Beta', 'Bet'],
    ['gamma', 'Gamma', 'Gam'],
    ['delta', 'Delta', 'Del'],
  ].map(([slug = '', title = '', short = '']) =>
    sampleEntry({
      project: { slug, title, short },
      facts: { proof: `Proof ${title}`, role: `Role ${title}` },
    }),
  );
  const bodies: readonly RankedProject[] = sampleRanked(entries);

  const mount = async (inputs: {
    bodies: readonly RankedProject[];
    hovered?: string | null;
    reading?: string | null;
  }) => {
    TestBed.configureTestingModule({
      imports: [FeaturedBarComponent],
      providers: [provideTexts(), provideRouter([])],
    });

    const fixture = TestBed.createComponent(FeaturedBarComponent);
    fixture.componentRef.setInput('bodies', inputs.bodies);
    fixture.componentRef.setInput('controls', 'preview-panel');
    fixture.componentRef.setInput('hovered', inputs.hovered ?? null);
    fixture.componentRef.setInput('reading', inputs.reading ?? null);
    await fixture.whenStable();

    return { fixture, host: fixture.nativeElement as HTMLElement };
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('opens with the "Projets en orbite" heading', async () => {
    const { host } = await mount({ bodies });
    expect(host.querySelector('h2')?.textContent?.trim()).toBe(
      'Projets en orbite',
    );
  });

  it('lists one marker button per body, in order, labelled and controlling the preview slot', async () => {
    const { host } = await mount({ bodies });
    const buttons = markerButtons(host);

    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      '01 — Alpha · Proof Alpha',
      '02 — Beta · Proof Beta',
      '03 — Gamma · Proof Gamma',
      '04 — Delta · Proof Delta',
    ]);
    expect(
      buttons.every(
        (button) => button.getAttribute('aria-controls') === 'preview-panel',
      ),
    ).toBe(true);
    expect(
      buttons.map((button) =>
        button.querySelector('.number')?.textContent?.trim(),
      ),
    ).toEqual(['01', '02', '03', '04']);
    expect(
      buttons.map((button) =>
        button.querySelector('.short')?.textContent?.trim(),
      ),
    ).toEqual(['Alp', 'Bet', 'Gam', 'Del']);
  });

  it('hands every marker to the object as a line, so each rises with its planet', async () => {
    const { host } = await mount({ bodies });

    expect(TestBed.inject(LayoutAnchorsService).list('line')).toEqual(
      markerButtons(host),
    );
  });

  it('spreads the markers evenly along the belt, from 2% to 58%', async () => {
    const { host } = await mount({ bodies });
    const items = markerButtons(host).map(
      (button) => button.closest<HTMLLIElement>('li')?.style.left,
    );

    expect(items).toEqual(['2%', '20.7%', '39.3%', '58%']);
  });

  it('places two markers at the belt ends, with none stranded in between', async () => {
    const { host } = await mount({ bodies: bodies.slice(0, 2) });
    const items = markerButtons(host).map(
      (button) => button.closest<HTMLLIElement>('li')?.style.left,
    );

    expect(items).toEqual(['2%', '58%']);
  });

  it('keeps the gap and widens the belt for more markers', async () => {
    const five = sampleRanked([...entries, sampleEntry()]);
    const { host } = await mount({ bodies: five });
    const items = markerButtons(host).map(
      (button) => button.closest<HTMLLIElement>('li')?.style.left,
    );

    expect(items).toEqual(['2%', '20.7%', '39.3%', '58%', '76.7%']);
  });

  it('keeps the export belt for fewer markers', async () => {
    const { host } = await mount({ bodies: bodies.slice(0, 3) });
    const items = markerButtons(host).map(
      (button) => button.closest<HTMLLIElement>('li')?.style.left,
    );

    expect(items).toEqual(['2%', '30%', '58%']);
  });

  it('never runs the belt past 94% of the track, however many markers', async () => {
    const many = sampleRanked(
      Array.from({ length: 12 }, (_, rank) =>
        sampleEntry({ project: { slug: `p${String(rank)}` } }),
      ),
    );
    const { host } = await mount({ bodies: many });
    const last = markerButtons(host).at(-1)?.closest<HTMLLIElement>('li');

    expect(last?.style.left).toBe('96%');
  });

  describe('when the names would overlap', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('keeps the names while each marker has ~130px of its own', async () => {
      stubTrackWidth(700);
      const { host } = await mount({ bodies });

      expect(host.dataset['crowded']).toBe('false');
    });

    it('gives the names way to the numbers below that', async () => {
      stubTrackWidth(500);
      const { host } = await mount({ bodies });

      expect(host.dataset['crowded']).toBe('true');
    });

    it('says nothing is crowded where nothing is laid out', async () => {
      const { host } = await mount({ bodies });

      expect(host.dataset['crowded']).not.toBe('true');
    });
  });

  it('lights only the hovered marker', async () => {
    const { host } = await mount({ bodies, hovered: 'beta' });
    const lit = markerButtons(host).map((button) => button.dataset['lit']);

    expect(lit).toEqual(['false', 'true', 'false', 'false']);
  });

  it('lights no marker when nothing is hovered', async () => {
    const { host } = await mount({ bodies, hovered: null });
    const lit = markerButtons(host).map((button) => button.dataset['lit']);

    expect(lit).toEqual(['false', 'false', 'false', 'false']);
  });

  it("emits chosen with the clicked body's slug, one per click, in order", async () => {
    const { fixture, host } = await mount({ bodies });
    const emitted: string[] = [];
    fixture.componentInstance.chosen.subscribe((slug: string) =>
      emitted.push(slug),
    );

    const buttons = markerButtons(host);
    buttons[2]?.click();
    buttons[0]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['gamma', 'alpha']);
  });

  it('emits hoveredChange with the slug on a mouse hover and a keyboard focus, null on leaving them', async () => {
    const { fixture, host } = await mount({ bodies });
    const emitted: (string | null)[] = [];
    fixture.componentInstance.hoveredChange.subscribe((slug: string | null) => {
      emitted.push(slug);
    });

    const [first] = markerButtons(host);
    if (!first) {
      throw new Error('expected at least one marker button');
    }

    first.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    first.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    first.focus();
    first.blur();
    await fixture.whenStable();

    expect(emitted).toEqual(['alpha', null, 'alpha', null]);
  });

  it('links to the full index', async () => {
    const { host } = await mount({ bodies });
    const link = [...host.querySelectorAll('a')].find(
      (anchor) => anchor.textContent?.trim() === 'Tous les projets →',
    );

    expect(link?.getAttribute('href')).toBe('/projets');
  });

  it('reads the hovered body first, over the reading fallback', async () => {
    const { host } = await mount({ bodies, hovered: 'gamma', reading: 'beta' });
    const reading = host.querySelector('.reading');

    expect(reading?.getAttribute('aria-live')).toBe('polite');
    const title = reading?.querySelector('.title')?.textContent ?? '';
    expect(title).toContain('03');
    expect(title).toContain('Gamma');
    expect(reading?.textContent).toContain('Proof Gamma');
    expect(reading?.textContent).toContain('Role Gamma');
  });

  it('falls back to the reading body when nothing is hovered', async () => {
    const { host } = await mount({ bodies, hovered: null, reading: 'delta' });
    const reading = host.querySelector('.reading');
    const title = reading?.querySelector('.title')?.textContent ?? '';

    expect(title).toContain('04');
    expect(title).toContain('Delta');
    expect(reading?.textContent).toContain('Proof Delta');
  });

  it('falls back to the first body when nothing is hovered nor read', async () => {
    const { host } = await mount({ bodies, hovered: null, reading: null });
    const reading = host.querySelector('.reading');
    const title = reading?.querySelector('.title')?.textContent ?? '';

    expect(title).toContain('01');
    expect(title).toContain('Alpha');
    expect(reading?.textContent).toContain('Proof Alpha');
  });
});
