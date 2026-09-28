import { SCENE_CONFIG } from '../../models/scene-config.model';
export const MATTER_ENTRY_SPAN = SCENE_CONFIG.matter.entrySpan;

export const hastenedEntrySpan = (entry: number, within: number): number =>
  Math.min(MATTER_ENTRY_SPAN, within / (1 - entry));
