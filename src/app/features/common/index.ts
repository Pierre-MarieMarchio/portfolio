/*
 * The shared kernel: what two features genuinely need of each other, as ports
 * (an interface and its InjectionToken) and nothing else. It imports nothing
 * from this repository, which is what keeps "no feature imports another
 * feature" absolute: the need descends here instead of one feature reaching
 * for another, and app.config.ts answers it with `useExisting`.
 *
 * Three conditions, all of them, before anything is added:
 *
 *   1. At least two features consume it.
 *   2. None of them could get it from `pages/` instead: the need arises in a
 *      service, an effect or a feature's own component, not in a composition.
 *   3. It is cut down to what the consumers actually call, not to what the
 *      provider happens to expose.
 *
 * Otherwise the port belongs to `features/<consumer>/ports/`, and the join is
 * written in `pages/<x>.provider.ts`.
 *
 * `links/`: where each view is, in the reader's language. The projects link
 * to a sheet and to the index, the station steps back to a view; the route
 * table belongs to the composition, which answers `LINKS`.
 */

export * from './links';
