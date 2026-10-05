import {
  createEnvironmentInjector,
  DebugElement,
  EnvironmentInjector,
  OutputRef,
  PLATFORM_ID,
  ProviderToken,
  Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

export type Platform = 'browser' | 'server';

export const onPlatform = (platform: Platform): void => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
};

export const injectOn = <T>(token: ProviderToken<T>, platform: Platform): T => {
  onPlatform(platform);
  return TestBed.inject(token);
};

export const injectInScope = <T>(
  token: Type<T>,
): { readonly instance: T; readonly destroy: () => void } => {
  const scope = createEnvironmentInjector(
    [token],
    TestBed.inject(EnvironmentInjector),
  );
  return {
    instance: scope.get(token),
    destroy: () => {
      scope.destroy();
    },
  };
};

export const recordOutput = <T>(output: OutputRef<T>): T[] => {
  const emitted: T[] = [];
  output.subscribe((value) => {
    emitted.push(value);
  });
  return emitted;
};

export const componentOf = <T>(
  fixture: { readonly debugElement: DebugElement },
  type: Type<T>,
): T =>
  fixture.debugElement.query((node) => node.componentInstance instanceof type)
    .componentInstance as T;

export const at = <T>(items: readonly T[], index: number): T => {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`expected an item at index ${String(index)}, found none`);
  }
  return item;
};

type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N
  ? R
  : Tuple<T, N, [...R, T]>;

export const tupleOf = <T, N extends number>(
  items: readonly T[],
  length: N,
): Tuple<T, N> => {
  if (items.length < length) {
    throw new Error(
      `expected ${String(length)} items, found ${String(items.length)}`,
    );
  }
  return items.slice(0, length) as Tuple<T, N>;
};
