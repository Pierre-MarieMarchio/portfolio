import { ProjectEntry } from '../models';
import { SKYTED_VOICE } from './projects/skyted-voice.data';
import { SKYTED_APP } from './projects/skyted-app.data';
import { NGX_STATEWISE } from './projects/ngx-statewise.data';
import { TEMPLATE_DOTNET } from './projects/template-dotnet.data';
import { BKONE } from './projects/bkone.data';
import { SKYTED_COMPANION } from './projects/skyted-companion.data';
import { SPEAKEY } from './projects/speakey.data';

/**
 * The projects, in rank order: the order is the distance from the centre in
 * the mockup, and the reading order everywhere else. Filtering never reorders.
 * The first `FEATURED` are the featured ones.
 *
 * Each project is one file under `projects/`, holding its identity, its
 * facts and its detail: adding one is writing that file and naming it here
 * (docs/contenu.md). Its type refuses an entry without facts or detail.
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
