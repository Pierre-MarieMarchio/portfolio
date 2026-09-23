import { DetailSource, ProjectEntry } from '../models';
import { localize } from '@app/core/rules';
import { PROJECTS } from './projects.data';

describe('shipped project content', () => {
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
});
