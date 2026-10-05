import { ProjectEntry } from '../models';
import { readProjectEntries } from '../rules';
import raw from './projects.data.json';

export const PROJECTS: readonly ProjectEntry[] = readProjectEntries(raw);
