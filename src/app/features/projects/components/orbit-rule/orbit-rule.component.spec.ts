import { TestBed } from '@angular/core/testing';
import { ObjectRegistry } from '@shared/ui/object-marks';
import { provideRouter } from '@angular/router';
import { sampleEntry, sampleRanked } from '@testing/fake-managers';
import { RankedProject } from '../../models';
import { OrbitRuleComponent } from './orbit-rule.component';
import { provideTexts } from '@testing/texts';

describe('OrbitRuleComponent', () => {
  /** Four bodies, each with a distinct title, short, proof and role. */
  const bodies: readonly RankedProject[] = [
    ['alpha', 'Alpha', 'Alp'],
    ['beta', 'Beta', 'Bet'],
    ['gamma', 'Gamma', 'Gam'],
    ['delta', 'Delta', 'Del'],
  ].map(([slug = '', title = '', short = ''], rank) =>
    sampleRanked(
      sampleEntry({
        project: { slug, title, short },
        facts: { proof: `Proof ${title}`, role: `Role ${title}` },
      }),
      rank,
    ),
  );

  const mount = async (inputs: {
    bodies: readonly RankedProject[];
    hovered?: string | null;
    reading?: string | null;
  }) => {
    TestBed.configureTestingModule({
      imports: [OrbitRuleComponent],
      providers: [provideTexts(), provideRouter([])],
    });

    const fixture = TestBed.createComponent(OrbitRuleComponent);
    fixture.componentRef.setInput('bodies', inputs.bodies);
    fixture.componentRef.setInput('controls', 'preview-panel');
    fixture.componentRef.setInput('hovered', inputs.hovered ?? null);
    fixture.componentRef.setInput('reading', inputs.reading ?? null);
    await fixture.whenStable();

    return { fixture, host: fixture.nativeElement as HTMLElement };
  };

  const markerButtons = (host: HTMLElement): HTMLButtonElement[] =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('button'));

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

    expect(TestBed.inject(ObjectRegistry).lines()).toEqual(markerButtons(host));
  });

  it('spreads the markers evenly along the belt, from 2% to 58%', async () => {
    const { host } = await mount({ bodies });
    // The percentages the truths describe as "2.0%"/"58.0%" are what the
    // component assigns; the browser's own style serialisation (jsdom
    // included) drops a trailing ".0" on whole numbers, so that is what a
    // reader inspecting the rendered style sees.
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

  /** Five featured: the gap of four is kept, and the belt widens. */
  it('keeps the gap and widens the belt for more markers', async () => {
    const five = [...bodies, sampleRanked(sampleEntry(), 4)];
    const { host } = await mount({ bodies: five });
    const items = markerButtons(host).map(
      (button) => button.closest<HTMLLIElement>('li')?.style.left,
    );

    expect(items).toEqual(['2%', '20.7%', '39.3%', '58%', '76.7%']);
  });

  /** Three featured: the export's belt, the markers further apart. */
  it('keeps the export belt for fewer markers', async () => {
    const { host } = await mount({ bodies: bodies.slice(0, 3) });
    const items = markerButtons(host).map(
      (button) => button.closest<HTMLLIElement>('li')?.style.left,
    );

    expect(items).toEqual(['2%', '30%', '58%']);
  });

  it('never runs the belt past 94% of the track, however many markers', async () => {
    const many = Array.from({ length: 12 }, (_, rank) =>
      sampleRanked(
        sampleEntry({ project: { slug: `p${String(rank)}` } }),
        rank,
      ),
    );
    const { host } = await mount({ bodies: many });
    const last = markerButtons(host).at(-1)?.closest<HTMLLIElement>('li');

    expect(last?.style.left).toBe('96%');
  });

  describe('when the names would overlap', () => {
    /** jsdom lays nothing out: the track answers the width it is given. */
    const widen = (width: number) =>
      vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({ width } as DOMRect);

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('keeps the names while each marker has ~130px of its own', async () => {
      widen(700);
      const { host } = await mount({ bodies });

      expect(host.getAttribute('data-crowded')).toBe('false');
    });

    it('gives the names way to the numbers below that', async () => {
      widen(500);
      const { host } = await mount({ bodies });

      expect(host.getAttribute('data-crowded')).toBe('true');
    });

    it('says nothing is crowded where nothing is laid out', async () => {
      const { host } = await mount({ bodies });

      expect(host.getAttribute('data-crowded')).not.toBe('true');
    });
  });

  it('lights only the hovered marker', async () => {
    const { host } = await mount({ bodies, hovered: 'beta' });
    const lit = markerButtons(host).map((button) =>
      button.getAttribute('data-lit'),
    );

    expect(lit).toEqual(['false', 'true', 'false', 'false']);
  });

  it('lights no marker when nothing is hovered', async () => {
    const { host } = await mount({ bodies, hovered: null });
    const lit = markerButtons(host).map((button) =>
      button.getAttribute('data-lit'),
    );

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

  it('emits hoveredChange with the slug on mouseenter and focus, null on mouseleave and blur', async () => {
    const { fixture, host } = await mount({ bodies });
    const emitted: (string | null)[] = [];
    fixture.componentInstance.hoveredChange.subscribe((slug: string | null) => {
      emitted.push(slug);
    });

    const [first] = markerButtons(host);
    if (!first) {
      throw new Error('expected at least one marker button');
    }

    first.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    first.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    first.dispatchEvent(new FocusEvent('focus'));
    first.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();

    expect(emitted).toEqual(['alpha', null, 'alpha', null]);
  });

  it('links to the full index', async () => {
    const { host } = await mount({ bodies });
    const link = Array.from(host.querySelectorAll('a')).find(
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
