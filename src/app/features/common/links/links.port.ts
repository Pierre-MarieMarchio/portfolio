/**
 * Where each view of the site is, in the reader's language (D4: French at
 * the root, English under `/en`). Two features link to views: the projects
 * (a sheet, the index) and the station (the way back). Neither may know the
 * route table, which belongs to the composition.
 */
export interface ILinks {
  home(): string;
  index(): string;
  about(): string;
  sheet(slug: string): string;
}
