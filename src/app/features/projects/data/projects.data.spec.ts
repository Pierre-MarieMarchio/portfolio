import { ProjectEntry, SheetSource } from '../models';
import { localize } from '@app/core/rules';
import { PROJECTS } from './projects.data';

/**
 * The shipped content's shape. That every string matches the export is
 * established by comparing against the export itself, which a spec cannot
 * read; what a spec holds is what the rest of the site relies on. Nothing
 * here names a project or counts them: adding one is writing its file, and
 * no spec is to be edited for it.
 */
describe('shipped project content', () => {
  const slugs = PROJECTS.map((entry) => entry.project.slug);

  it('names each project by a slug of its own, fit for an address', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('gives every sheet at least one chapter with prose, in both languages', () => {
    const chapters = PROJECTS.flatMap(({ sheet }) =>
      (['fr', 'en'] as const).flatMap((lang) => localize(sheet, lang).chapters),
    );
    for (const { sheet } of PROJECTS) {
      expect(sheet.chapters.length).toBeGreaterThan(0);
    }
    for (const chapter of chapters) {
      expect(chapter.paragraphs.length).toBeGreaterThan(0);
      expect(chapter.paragraphs.every((each) => each.length > 0)).toBe(true);
    }
  });

  /** D5: a text that differs is written in both, side by side. */
  it('writes every text of a project in both languages', () => {
    for (const entry of PROJECTS) {
      const fr = JSON.stringify(localize(entry, 'fr'));
      const en = JSON.stringify(localize(entry, 'en'));
      expect(fr).not.toBe(en);
      expect(en).not.toContain('undefined');
    }
  });

  it('captions every figure, and gives it something to draw', () => {
    for (const { sheet } of PROJECTS) {
      for (const { figure } of sheet.chapters) {
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

  /** The acceptance criterion: an entry without facts or sheet is refused. */
  it('refuses a project written without its facts or its sheet', () => {
    const [first] = PROJECTS;
    if (!first) {
      throw new Error('expected at least one project');
    }
    // @ts-expect-error an entry must carry its facts
    const noFacts: ProjectEntry = {
      project: first.project,
      sheet: first.sheet,
    };
    // @ts-expect-error an entry must carry its sheet
    const noSheet: ProjectEntry = {
      project: first.project,
      facts: first.facts,
    };

    expect([noFacts, noSheet]).toHaveLength(2);
  });

  /**
   * One source per fact: a sheet carries none of them. The type refuses a
   * sheet that would, so a second table cannot come back unnoticed.
   */
  it('keeps facts out of the sheets', () => {
    const sheet: SheetSource = {
      lede: 'l',
      links: [],
      chapters: [],
      // @ts-expect-error a fact belongs to the facts, never to a sheet
      proof: 'Dépôt public',
    };

    expect(Object.keys(sheet)).toContain('proof');
    for (const { sheet: each } of PROJECTS) {
      for (const field of ['proof', 'proofLevel', 'role', 'stack', 'context']) {
        expect(Object.keys(each)).not.toContain(field);
      }
    }
  });
});
