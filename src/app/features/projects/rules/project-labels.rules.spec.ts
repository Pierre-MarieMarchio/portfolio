import { TestBed } from '@angular/core/testing';
import { localize } from '@app/core/rules';
import {
  sampleDetail,
  sampleEntry,
  sampleRanked,
} from '@testing/fixtures/project.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { PROJECTS_TEXTS, ProjectsTexts } from '../ports';
import {
  chapterTitle,
  positionOf,
  proofLevelLabel,
  rowLabel,
} from './project-labels.rules';

describe('project labels', () => {
  let texts: ProjectsTexts;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTexts()] });
    texts = TestBed.inject(PROJECTS_TEXTS)();
  });

  it('names a row by its number, its title and its proof', () => {
    const [, second] = sampleRanked([
      sampleEntry(),
      sampleEntry({
        project: { slug: 'voice', title: 'Skyted Voice' },
        facts: { proof: 'Publiée · deux magasins' },
      }),
    ]);
    if (!second) {
      throw new Error('expected a second project');
    }

    expect(rowLabel(second)).toBe(
      '02 — Skyted Voice · Publiée · deux magasins',
    );
  });

  it('places an item among its peers on two digits', () => {
    expect(positionOf(3, 7)).toBe('03 / 07');
    expect(positionOf(12, 12)).toBe('12 / 12');
  });

  it('says a proof level in words', () => {
    expect(proofLevelLabel('public', texts.proofLevels)).toBe(
      'Ouvrable par vous',
    );
    expect(proofLevelLabel('indirect', texts.proofLevels)).toBe(
      'Vérifiable, code privé',
    );
    expect(proofLevelLabel('none', texts.proofLevels)).toBe(
      'Sur récit seulement',
    );
  });

  it('titles a chapter by its own title, else the default of its place', () => {
    const detail = localize(
      sampleDetail({
        chapters: [
          { paragraphs: [] },
          { title: 'Qu’est-ce qui tient ?', paragraphs: [] },
        ],
      }),
      'fr',
    );
    const defaults = texts.defaultChapterTitles;

    expect(chapterTitle(detail, 0, defaults)).toBe('Pourquoi ?');
    expect(chapterTitle(detail, 1, defaults)).toBe('Qu’est-ce qui tient ?');
    expect(chapterTitle(detail, 2, defaults)).toBe('');
    expect(chapterTitle(null, 0, defaults)).toBe('');
  });
});
