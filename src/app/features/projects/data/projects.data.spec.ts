import { DetailSource, ProjectEntry } from '../models';
import { draftsLeft, forgetDraftsAfter, localize } from '@app/core/rules';
import { readProjectEntries } from '../rules';
import { PROJECTS } from './projects.data';
import projectsJson from './projects.data.json';

const MINIMAL = {
  project: {
    slug: 'sample',
    title: 'Sample',
    short: 'Sample',
    family: 'personal',
    subject: 'A subject',
    summary: 'A summary',
  },
  facts: {
    proof: 'Proof',
    role: 'Role',
    stack: 'Stack',
    context: 'Context',
    period: '2026',
  },
  detail: {
    lede: 'A lede',
    links: [],
    chapters: [{ paragraphs: ['A paragraph'] }],
  },
};

function projectWith(patch: object): unknown[] {
  return [{ ...MINIMAL, project: { ...MINIMAL.project, ...patch } }];
}

function without(source: object, key: string): object {
  return Object.fromEntries(
    Object.entries(source).filter(([each]) => each !== key),
  );
}

describe('shipped project content', () => {
  let draftsBefore = 0;

  beforeEach(() => {
    draftsBefore = draftsLeft();
  });

  afterEach(() => {
    forgetDraftsAfter(draftsBefore);
  });

  const slugs = PROJECTS.map((entry) => entry.project.slug);

  it('names each project by a slug of its own, fit for an address', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('gives every sheet at least one chapter with prose, in both languages', () => {
    const chapters = PROJECTS.flatMap(({ detail }) =>
      (['fr', 'en'] as const).flatMap(
        (lang) => localize(detail, lang).chapters,
      ),
    );
    for (const { detail } of PROJECTS) {
      expect(detail.chapters.length).toBeGreaterThan(0);
    }
    for (const chapter of chapters) {
      expect(chapter.paragraphs.length).toBeGreaterThan(0);
      expect(chapter.paragraphs.every((each) => each.length > 0)).toBe(true);
    }
  });

  it('writes every text of a project in both languages', () => {
    for (const entry of PROJECTS) {
      const fr = JSON.stringify(localize(entry, 'fr'));
      const en = JSON.stringify(localize(entry, 'en'));
      expect(fr).not.toBe(en);
      expect(en).not.toContain('undefined');
    }
  });

  it('captions every figure, and gives it something to draw', () => {
    for (const { detail } of PROJECTS) {
      for (const { figure } of detail.chapters) {
        if (!figure) {
          continue;
        }
        expect(figure.caption).toBeTruthy();
        expect(
          figure.kind === 'flow' ? figure.steps : figure.layers,
        ).not.toHaveLength(0);
      }
    }
  });

  it('refuses a project written without its facts or its sheet', () => {
    const [first] = PROJECTS;
    if (!first) {
      throw new Error('expected at least one project');
    }
    // @ts-expect-error an entry must carry its facts
    const noFacts: ProjectEntry = {
      project: first.project,
      detail: first.detail,
    };
    // @ts-expect-error an entry must carry its detail
    const noDetail: ProjectEntry = {
      project: first.project,
      facts: first.facts,
    };

    expect([noFacts, noDetail]).toHaveLength(2);
  });

  it('keeps facts out of the sheets', () => {
    const detail: DetailSource = {
      lede: 'l',
      links: [],
      chapters: [],
      // @ts-expect-error a fact belongs to the facts, never to a sheet
      proof: 'Dépôt public',
    };

    expect(Object.keys(detail)).toContain('proof');
    for (const { detail: each } of PROJECTS) {
      for (const field of ['proof', 'role', 'stack', 'context', 'period']) {
        expect(Object.keys(each)).not.toContain(field);
      }
    }
  });

  it('reads the shipped file into one entry per object, in file order', () => {
    const entries = readProjectEntries(projectsJson);

    expect(entries.map((entry) => entry.project.slug)).toEqual(
      projectsJson.map((entry) => entry.project.slug),
    );
    expect(entries).toEqual(PROJECTS);
  });

  it('accepts a minimal entry and keeps an absent tag absent', () => {
    const [entry] = readProjectEntries([MINIMAL]);

    expect(Object.keys(entry?.project ?? {})).not.toContain('tag');
    expect(entry?.detail.chapters).toEqual([{ paragraphs: ['A paragraph'] }]);
  });

  it('turns an enDraft into a counted draft and an en into a reviewed text', () => {
    const before = draftsLeft();
    const [entry] = readProjectEntries([
      {
        ...MINIMAL,
        project: {
          ...MINIMAL.project,
          title: { fr: 'Titre', enDraft: 'Title' },
          short: { fr: 'Court', en: 'Short' },
        },
      },
    ]);

    expect(draftsLeft() - before).toBe(1);
    expect(localize(entry?.project, 'en')).toMatchObject({
      title: 'Title',
      short: 'Short',
    });
    expect(localize(entry?.project, 'fr')).toMatchObject({
      title: 'Titre',
      short: 'Court',
    });
  });

  it('names the slug and the field of a missing field', () => {
    const chapters = [
      { paragraphs: ['a'] },
      { paragraphs: ['b'] },
      { title: { en: 'Title' }, paragraphs: ['c'] },
    ];

    expect(() =>
      readProjectEntries([
        { ...MINIMAL, facts: without(MINIMAL.facts, 'role') },
      ]),
    ).toThrow('sample: facts.role: expected an object, found missing');
    expect(() =>
      readProjectEntries([
        { ...MINIMAL, detail: { ...MINIMAL.detail, chapters } },
      ]),
    ).toThrow('sample: detail.chapters[2].title.fr: expected a string');
  });

  it('refuses a family outside the model, and a wrong type', () => {
    expect(() => readProjectEntries(projectWith({ family: 'hobby' }))).toThrow(
      'sample: project.family: expected one of professional, personal, found "hobby"',
    );
    expect(() => readProjectEntries(projectWith({ summary: 3 }))).toThrow(
      'sample: project.summary: expected an object, found 3',
    );
  });

  it('refuses a text carrying both en and enDraft, or neither', () => {
    expect(() =>
      readProjectEntries(
        projectWith({ title: { fr: 'T', en: 'T', enDraft: 'T' } }),
      ),
    ).toThrow('sample: project.title: expected exactly one of en or enDraft');
    expect(() =>
      readProjectEntries(projectWith({ title: { fr: 'T' } })),
    ).toThrow('sample: project.title: expected exactly one of en or enDraft');
  });

  it('refuses a figure of an unknown kind, a duplicated slug and a root that is no list', () => {
    const figure = { kind: 'ring', caption: 'c' };
    const chapters = [{ paragraphs: ['a'], figure }];

    expect(() =>
      readProjectEntries([
        { ...MINIMAL, detail: { ...MINIMAL.detail, chapters } },
      ]),
    ).toThrow(
      'sample: detail.chapters[0].figure.kind: expected flow or layers',
    );
    expect(() => readProjectEntries([MINIMAL, MINIMAL])).toThrow(
      'sample: project.slug: duplicate slug',
    );
    expect(() => readProjectEntries({})).toThrow(
      'projects: expected an array, found {}',
    );
  });

  it('names an entry without a readable slug by its position', () => {
    expect(() => readProjectEntries([MINIMAL, 'nope'])).toThrow(
      '#1: entry: expected an object, found "nope"',
    );
  });
});
