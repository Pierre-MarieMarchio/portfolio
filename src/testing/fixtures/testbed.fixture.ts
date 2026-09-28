import {
  DebugElement,
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
