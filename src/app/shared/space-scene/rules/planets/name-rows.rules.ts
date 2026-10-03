const ROW_SHIFTS = 4;

export type RowFit = (row: number) => number | null;

function firstFlankFit(
  flanks: readonly number[],
  search: (fits: RowFit) => number | null,
  fits: (dir: number, row: number) => number | null,
): { dir: number; y: number } | null {
  for (const dir of flanks) {
    const y = search((row) => fits(dir, row));
    if (y !== null) {
      return { dir, y };
    }
  }
  return null;
}

export function firstFreePlace(
  flanks: readonly number[],
  searches: readonly ((fits: RowFit) => number | null)[],
  fits: (dir: number, row: number) => number | null,
): { dir: number; y: number } | null {
  for (const search of searches) {
    const found = firstFlankFit(flanks, search, fits);
    if (found) {
      return found;
    }
  }
  return null;
}

function firstFit(rows: readonly number[], fits: RowFit): number | null {
  for (const row of rows) {
    const found = fits(row);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

function staggeredRows(start: number, step: number): number[] {
  const rows = [start];
  for (let shift = 1; shift <= ROW_SHIFTS; shift++) {
    rows.push(start - shift * step, start + shift * step);
  }
  return rows;
}

export function firstFreeRow(
  start: number,
  step: number,
  fits: RowFit,
): number | null {
  return firstFit(staggeredRows(start, step), fits);
}

export function firstClearRow(
  start: number,
  rows: readonly number[],
  fits: RowFit,
): number | null {
  const nearest = [...rows].sort(
    (a, b) => Math.abs(a - start) - Math.abs(b - start),
  );
  return firstFit(nearest, fits);
}
