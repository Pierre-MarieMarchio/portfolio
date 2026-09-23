import { TestBed } from '@angular/core/testing';
import {
  ChapterOnShow,
  ProjectChapterComponent,
} from './project-chapter.component';

const FLOW: ChapterOnShow = {
  number: '02',
  heading: 'Comment',
  paragraphs: ['First paragraph.', 'Second one.'],
  bullets: [{ term: 'Terme', text: 'Explication' }],
  figure: {
    kind: 'flow',
    steps: ['action', 'updator', 'effect'],
    loop: 'nouvelles actions',
    caption: 'Séquence documentée dans le dépôt.',
  },
};

const LAYERS: ChapterOnShow = {
  number: '03',
  heading: 'Et ensuite',
  paragraphs: ['Last paragraph.'],
  figure: {
    kind: 'layers',
    layers: [
      { name: 'UI', projects: 'proj-a, proj-b' },
      { name: 'Core', projects: 'proj-b, proj-c' },
    ],
    caption: 'Arborescence réelle du dépôt.',
  },
};

const mount = async (chapter: ChapterOnShow) => {
  TestBed.configureTestingModule({ imports: [ProjectChapterComponent] });
  const fixture = TestBed.createComponent(ProjectChapterComponent);
  fixture.componentRef.setInput('chapter', chapter);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('ProjectChapterComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('titles the chapter with its number and heading', async () => {
    const host = await mount(FLOW);

    expect(host.querySelector('.chapter-title')?.textContent?.trim()).toBe(
      '02 · Comment',
    );
  });

  it('renders every paragraph in order', async () => {
    const host = await mount(FLOW);
    const paragraphs = [...host.querySelectorAll('p:not(.chapter-title)')].map(
      (p) => p.textContent?.trim(),
    );

    expect(paragraphs).toEqual(['First paragraph.', 'Second one.']);
  });

  it('lists the bullets with their term, and has no list without them', async () => {
    const withBullets = await mount(FLOW);
    const bullet = withBullets.querySelector('.bullets li');
    expect(bullet?.querySelector('.term')?.textContent?.trim()).toBe('Terme');
    expect(bullet?.textContent).toContain('Explication');

    TestBed.resetTestingModule();
    const without = await mount(LAYERS);
    expect(without.querySelector('.bullets')).toBeNull();
  });

  it('draws a flow with an arrow between steps and one before the loop', async () => {
    const host = await mount(FLOW);
    const boxes = [...host.querySelectorAll('.flow .box')].map((box) =>
      box.textContent?.trim(),
    );

    expect(boxes).toEqual(['action', 'updator', 'effect']);
    expect(host.querySelectorAll('.flow .arrow')).toHaveLength(3);
    expect(host.querySelector('.flow .data')?.textContent?.trim()).toBe(
      'nouvelles actions',
    );
    expect(host.querySelector('.layers')).toBeNull();
    expect(host.querySelector('figcaption')?.textContent?.trim()).toBe(
      'Séquence documentée dans le dépôt.',
    );
  });

  it('draws one row per layer, and no flow', async () => {
    const host = await mount(LAYERS);
    const layers = [...host.querySelectorAll('.layer')];

    expect(layers).toHaveLength(2);
    expect(layers[1]?.querySelector('.layer-name')?.textContent?.trim()).toBe(
      'Core',
    );
    expect(
      layers[1]?.querySelector('.layer-projects')?.textContent?.trim(),
    ).toBe('proj-b, proj-c');
    expect(host.querySelector('.flow')).toBeNull();
    expect(host.querySelector('figcaption')?.textContent?.trim()).toBe(
      'Arborescence réelle du dépôt.',
    );
  });

  it('has no figure when the chapter carries none', async () => {
    const host = await mount({ ...FLOW, figure: undefined });

    expect(host.querySelector('figure')).toBeNull();
  });
});
