import { ProjectSheet } from '../models';
import { FACTS } from './facts.data';
import {
  DEFAULT_CHAPTER_TITLES,
  LAYERS,
  PROOF_LEVEL_LABELS,
} from './labels.data';
import { PROJECTS } from './projects.data';
import { SHEETS } from './sheets.data';

/** The export's `ordreOrbite`: the rank is the distance from the centre. */
const ORBIT_ORDER = [
  'skyted-voice',
  'skyted-app',
  'ngx-statewise',
  'template-dotnet',
  'bkone',
  'skyted-companion',
  'speakey',
];

/**
 * The shipped content's shape. That every string matches the export is
 * established by comparing against the export itself, which a spec cannot
 * read (no file access here); what a spec can hold is that the three tables
 * agree with each other and with the rank.
 */
describe('shipped project content', () => {
  it('ships the seven projects in the orbit order', () => {
    expect(PROJECTS.map((project) => project.slug)).toEqual(ORBIT_ORDER);
  });

  it('has exactly one facts entry and one sheet per project', () => {
    expect(Object.keys(FACTS).sort()).toEqual([...ORBIT_ORDER].sort());
    expect(Object.keys(SHEETS).sort()).toEqual([...ORBIT_ORDER].sort());
  });

  it('gives every sheet at least one chapter with prose', () => {
    for (const sheet of Object.values(SHEETS)) {
      expect(sheet.chapters.length).toBeGreaterThan(0);
      for (const chapter of sheet.chapters) {
        expect(chapter.paragraphs.length).toBeGreaterThan(0);
      }
    }
  });

  it('draws the two reading figures where the export places them', () => {
    const figures = Object.entries(SHEETS).flatMap(([slug, sheet]) =>
      sheet.chapters.flatMap((chapter, index) =>
        chapter.figure ? [`${slug}:${String(index)}:${chapter.figure}`] : [],
      ),
    );

    expect(figures).toEqual([
      'ngx-statewise:2:flow',
      'template-dotnet:2:layers',
    ]);
    expect(LAYERS).toHaveLength(5);
  });

  it('says every proof level in words, and titles four chapters by default', () => {
    expect(PROOF_LEVEL_LABELS).toEqual({
      public: 'Ouvrable par vous',
      indirect: 'Vérifiable, code privé',
      none: 'Sur récit seulement',
    });
    expect(DEFAULT_CHAPTER_TITLES).toHaveLength(4);
  });

  /**
   * One source per fact: a sheet carries none of them. The type refuses a
   * sheet that would, so a second table cannot come back unnoticed.
   */
  it('keeps facts out of the sheets', () => {
    const sheet: ProjectSheet = {
      title: 't',
      lede: 'l',
      links: [],
      chapters: [],
      // @ts-expect-error a fact belongs to FACTS, never to a sheet
      proof: 'Dépôt public',
    };

    expect(Object.keys(sheet)).toContain('proof');
    for (const each of Object.values(SHEETS)) {
      for (const field of ['proof', 'proofLevel', 'role', 'stack', 'context']) {
        expect(Object.keys(each)).not.toContain(field);
      }
    }
  });
});
