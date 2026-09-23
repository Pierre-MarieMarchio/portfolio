export function twoDigits(value: number): string {
  return value < 10 ? `0${String(value)}` : String(value);
}
