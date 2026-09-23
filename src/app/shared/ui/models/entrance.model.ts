/**
 * Where the home page's rest stands during the opening crossing: the pages,
 * the title, the rule and the contact rail wait for the reader, as in the
 * mockup, but stay in the document from the first frame for the prerender.
 *
 * - `timed`: no script yet (the prerender, or none at all). The CSS alone
 *   brings it in at `--arrival-at`, the end of the crossing.
 * - `held`: the script has taken over and holds it until the first gesture,
 *   or the end of the crossing.
 * - `shown`: here, rising from the moment it was let in.
 */
export type Entrance = 'timed' | 'held' | 'shown';
