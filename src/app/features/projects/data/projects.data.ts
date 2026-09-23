import { ProjectEntry } from '../models';
import { SKYTED_VOICE } from './projects/skyted-voice.project';
import { SKYTED_APP } from './projects/skyted-app.project';
import { NGX_STATEWISE } from './projects/ngx-statewise.project';
import { TEMPLATE_DOTNET } from './projects/template-dotnet.project';
import { BKONE } from './projects/bkone.project';
import { SKYTED_COMPANION } from './projects/skyted-companion.project';
import { SPEAKEY } from './projects/speakey.project';

/**
 * The projects, in rank order: the order is the distance from the centre in
 * the mockup, and the reading order everywhere else. Filtering never reorders.
 * The first `FEATURED_COUNT` are the featured ones.
 *
 * Each project is one file under `projects/`, holding its identity, its
 * facts and its sheet: adding one is writing that file and naming it here
 * (docs/contenu.md). Its type refuses an entry without facts or sheet.
 *
 * Content, not data: it ships with the site. Only the repository reads it,
 * so a remote source can replace this file without any other one noticing.
 */
export const PROJECTS: readonly ProjectEntry[] = [
  SKYTED_VOICE,
  SKYTED_APP,
  NGX_STATEWISE,
  TEMPLATE_DOTNET,
  BKONE,
  SKYTED_COMPANION,
  SPEAKEY,
];
