import { TestBed } from '@angular/core/testing';
import { LayoutAnchorsService } from '@shared/ui/services';
import { provideRouter } from '@angular/router';
import { sampleEntry, sampleRanked } from '@testing/fixtures/project.fixture';
import { RankedProject } from '../../models';
import { PROJECTS_TEXTS } from '../../ports';
import { rowLabel } from '../../rules/project-labels.rules';
import { FeaturedBarComponent } from './featured-bar.component';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { componentOf, recordOutput } from '@testing/fixtures/testbed.fixture';
import { provideMobileNavPlatform } from '@testing/doubles/mobile-nav-platform.double';
import { CardCarouselComponent } from '@shared/mobile-nav/components';

const markerButtons = (host: HTMLElement): HTMLButtonElement[] => [
  ...host.querySelectorAll<HTMLButtonElement>('.row .track button'),
];

const cardButtons = (host: HTMLElement): HTMLButtonElement[] => [
  ...host.querySelectorAll<HTMLButtonElement>('app-card-carousel .card'),
];

const stubTrackWidth = (width: number) =>
  vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ width } as DOMRect);

const emittedBy = (fixture: { componentInstance: FeaturedBarComponent }) => ({
  hovered: recordOutput(fixture.componentInstance.hoveredChange),
  chosen: recordOutput(fixture.componentInstance.chosen),
});

const rankedOf = (count: number): RankedProject[] =>
  sampleRanked(
    Array.from({ length: count }, (_, rank) =>
      sampleEntry({ project: { slug: `p${String(rank)}` } }),
    ),
  );

describe('FeaturedBarComponent', () => {
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
      providers: [
        provideTexts(),
        provideRouter([]),
        provideMobileNavPlatform(),
      ],
    });

    const fixture = TestBed.createComponent(FeaturedBarComponent);
    fixture.componentRef.setInput('bodies', inputs.bodies);
    fixture.componentRef.setInput('controls', 'preview-panel');
    fixture.componentRef.setInput('hovered', inputs.hovered ?? null);
    fixture.componentRef.setInput('reading', inputs.reading ?? null);
    await fixture.whenStable();

    return {
      fixture,
      host: fixture.nativeElement as HTMLElement,
      texts: TestBed.inject(PROJECTS_TEXTS)().rule,
    };
  };

  it('opens with its heading', async () => {
    const { host, texts } = await mount({ bodies });
    expect(host.querySelector('h2')?.textContent?.trim()).toBe(texts.heading);
  });

  it('lists one marker button per body, in order, labelled and controlling the preview slot', async () => {
    const { host } = await mount({ bodies });
    const buttons = markerButtons(host);

    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(
      bodies.map((body) => rowLabel(body)),
    );
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

  it.each([
    {
      case: 'places two markers at the belt ends, with none stranded in between',
      count: 2,
      lefts: ['2%', '58%'],
    },
    {
      case: 'keeps the export belt for three markers',
      count: 3,
      lefts: ['2%', '30%', '58%'],
    },
    {
      case: 'spreads four markers evenly along the belt, from 2% to 58%',
      count: 4,
      lefts: ['2%', '20.7%', '39.3%', '58%'],
    },
    {
      case: 'keeps the gap and widens the belt for five markers',
      count: 5,
      lefts: ['2%', '20.7%', '39.3%', '58%', '76.7%'],
    },
  ])('$case', async ({ count, lefts }) => {
    const { host } = await mount({ bodies: rankedOf(count) });
    const items = markerButtons(host).map(
      (button) => button.closest<HTMLLIElement>('li')?.style.left,
    );

    expect(items).toEqual(lefts);
  });

  it('never runs the belt past 96% of the track, however many markers', async () => {
    const { host } = await mount({ bodies: rankedOf(12) });
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

  it.each([
    ['only the hovered marker', 'beta', ['false', 'true', 'false', 'false']],
    [
      'no marker when nothing is hovered',
      null,
      ['false', 'false', 'false', 'false'],
    ],
  ])('lights %s', async (_case, hovered, lit) => {
    const { host } = await mount({ bodies, hovered });

    expect(markerButtons(host).map((button) => button.dataset['lit'])).toEqual(
      lit,
    );
  });

  it("emits chosen with the clicked body's slug, one per click, in order", async () => {
    const { fixture, host } = await mount({ bodies });
    const emitted = recordOutput(fixture.componentInstance.chosen);

    const buttons = markerButtons(host);
    buttons[2]?.click();
    buttons[0]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['gamma', 'alpha']);
  });

  it('emits hoveredChange with the slug on a mouse hover and a keyboard focus, null on leaving them', async () => {
    const { fixture, host } = await mount({ bodies });
    const emitted = recordOutput(fixture.componentInstance.hoveredChange);

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
    const { host, texts } = await mount({ bodies });
    const link = [...host.querySelectorAll('a')].find(
      (anchor) => anchor.textContent?.trim() === texts.all,
    );

    expect(link?.getAttribute('href')).toBe('/projets');
  });

  it.each([
    {
      case: 'the hovered body first, over the reading fallback',
      hovered: 'gamma',
      reading: 'beta',
      number: '03',
      title: 'Gamma',
    },
    {
      case: 'the reading body when nothing is hovered',
      hovered: null,
      reading: 'delta',
      number: '04',
      title: 'Delta',
    },
    {
      case: 'the first body when nothing is hovered nor read',
      hovered: null,
      reading: null,
      number: '01',
      title: 'Alpha',
    },
  ])('reads $case, politely', async ({ hovered, reading, number, title }) => {
    const { host } = await mount({ bodies, hovered, reading });
    const panel = host.querySelector('.reading');
    const heading = panel?.querySelector('.title')?.textContent ?? '';

    expect(panel?.getAttribute('aria-live')).toBe('polite');
    expect(heading).toContain(number);
    expect(heading).toContain(title);
    expect(panel?.textContent).toContain(`Proof ${title}`);
    expect(panel?.textContent).toContain(`Role ${title}`);
  });

  describe('the cards, one project at a time', () => {
    it('draws one card button per body, with its name, its proof and its stack, controlling the preview slot', async () => {
      const { host, texts } = await mount({ bodies });
      const cards = cardButtons(host);

      expect(
        host.querySelector('app-card-carousel')?.getAttribute('aria-label'),
      ).toBe(texts.heading);
      expect(cards).toHaveLength(4);
      expect(cards[1]?.textContent).toContain('02');
      expect(cards[1]?.textContent).toContain('Beta');
      expect(cards[1]?.textContent).toContain('Proof Beta');
      expect(cards[1]?.textContent).toContain(bodies[1]?.facts.stack);
      expect(
        cards.every(
          (card) => card.getAttribute('aria-controls') === 'preview-panel',
        ),
      ).toBe(true);
    });

    it.each([
      ['the first card at rest', null, null, 0],
      ['the card of the last project read', null, 'delta', 3],
      ['the card of the designated project', 'gamma', 'delta', 2],
    ])('shows %s', async (_case, hovered, reading, card) => {
      const { host } = await mount({ bodies, hovered, reading });

      expect(
        cardButtons(host).findIndex((button) =>
          button.hasAttribute('aria-current'),
        ),
      ).toBe(card);
    });

    it('designates the project of the card the reader swiped to', async () => {
      const { fixture } = await mount({ bodies });
      const { hovered } = emittedBy(fixture);

      componentOf(fixture, CardCarouselComponent).activeChange.emit(2);

      expect(hovered).toEqual(['gamma']);
    });

    it('opens the preview of a tapped card, designating it first', async () => {
      const { fixture, host } = await mount({ bodies, hovered: 'beta' });
      const { hovered, chosen } = emittedBy(fixture);

      cardButtons(host)[2]?.click();

      expect(hovered).toEqual(['gamma']);
      expect(chosen).toEqual(['gamma']);
    });

    it('takes the shown project from the tour as soon as the reader touches the cards', async () => {
      const { fixture, host } = await mount({ bodies, hovered: 'beta' });
      const { hovered } = emittedBy(fixture);

      host
        .querySelector('app-card-carousel')
        ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      expect(hovered).toEqual(['beta']);
    });
  });
});
