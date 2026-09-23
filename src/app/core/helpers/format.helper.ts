/**
 * A count or a rank on two digits, as the instrument prints them everywhere
 * ("07 fiches", "03 / 07"): the columns line up and a reader compares at a
 * glance.
 */
export function twoDigits(value: number): string {
  return value < 10 ? `0${String(value)}` : String(value);
}
