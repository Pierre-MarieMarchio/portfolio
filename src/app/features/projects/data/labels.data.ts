import { ProofLevel } from '../models';

/** The proof level said in words: it is the question a recruiter asks. */
export const PROOF_LEVEL_LABELS: Readonly<Record<ProofLevel, string>> = {
  public: 'Ouvrable par vous',
  indirect: 'Vérifiable, code privé',
  none: 'Sur récit seulement',
};

/**
 * The title of an untitled chapter, by position. A sheet may carry fewer
 * chapters and name its own: three written chapters beat four with an empty one.
 */
export const DEFAULT_CHAPTER_TITLES: readonly string[] = [
  'Pourquoi ?',
  'Qu’ai-je fait ?',
  'Quel arbitrage ?',
  'Qu’est-ce qui tient ?',
];
