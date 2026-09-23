export const printed = (value: unknown): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(3)
    : String(value);

export const fingerprintOf = (log: readonly string[]): string => {
  let hash = 0x81_1c_9d_c5;
  for (const line of log) {
    for (let i = 0; i < line.length; i++) {
      hash ^= line.codePointAt(i) ?? 0;
      hash = Math.imul(hash, 0x01_00_01_93) >>> 0;
    }
    hash ^= 10;
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

export const recordingContext = (
  name: string,
  log: string[],
): CanvasRenderingContext2D => {
  const gradient = (kind: string, args: readonly unknown[]) => ({
    addColorStop: (offset: number, color: string) => {
      log.push(
        `${name}.${kind}(${args.map((arg) => printed(arg)).join(',')}).stop(${printed(offset)},${color})`,
      );
    },
  });
  const target: Record<string, unknown> = {
    createRadialGradient: (...args: unknown[]) => gradient('radial', args),
    createLinearGradient: (...args: unknown[]) => gradient('linear', args),
    measureText: (text: string) => ({ width: text.length * 7 }),
  };
  return new Proxy(target, {
    get: (object, property: string) =>
      property in object
        ? object[property]
        : (...args: unknown[]) => {
            log.push(
              `${name}.${property}(${args.map((arg) => printed(arg)).join(',')})`,
            );
          },
    set: (_object, property: string, value: unknown) => {
      log.push(`${name}.${property}=${printed(value)}`);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
};
