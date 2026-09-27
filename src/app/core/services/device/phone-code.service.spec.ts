import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PhoneCodeService } from './phone-code.service';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

const stubTouch = () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: TOUCH.has(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

const resizeTo = (width: number, height: number) => {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
  window.dispatchEvent(new Event('resize'));
};

const CODE = { name: 'phone code' };

const loadOn = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  const importer = vi.fn(() => Promise.resolve(CODE));
  const loaded = TestBed.runInInjectionContext(() =>
    TestBed.inject(PhoneCodeService).load(importer),
  );
  return { importer, loaded };
};

describe('PhoneCodeService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('asks for the code once the client starts as a phone, and gives it', async () => {
    stubTouch();
    resizeTo(390, 844);
    const { importer, loaded } = loadOn('browser');

    expect(loaded()).toBeNull();
    TestBed.tick();
    await Promise.resolve();
    TestBed.tick();

    expect(importer).toHaveBeenCalledTimes(1);
    expect(loaded()).toBe(CODE);
  });

  it('never asks for it on a tablet or a desktop', async () => {
    stubTouch();
    resizeTo(1024, 768);
    const tablet = loadOn('browser');
    TestBed.tick();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    resizeTo(1440, 900);
    const desktop = loadOn('browser');
    TestBed.tick();
    await Promise.resolve();

    expect(tablet.importer).not.toHaveBeenCalled();
    expect(desktop.importer).not.toHaveBeenCalled();
    expect(desktop.loaded()).toBeNull();
  });

  it('asks for it when the format turns to phone, and only once', async () => {
    stubTouch();
    resizeTo(1024, 768);
    const { importer, loaded } = loadOn('browser');
    TestBed.tick();

    expect(importer).not.toHaveBeenCalled();

    resizeTo(390, 844);
    TestBed.tick();
    resizeTo(1024, 768);
    TestBed.tick();
    resizeTo(390, 844);
    TestBed.tick();
    await Promise.resolve();

    expect(importer).toHaveBeenCalledTimes(1);
    expect(loaded()).toBe(CODE);
  });

  it('asks again at the next phone format when the code failed to arrive', async () => {
    stubTouch();
    resizeTo(390, 844);
    TestBed.configureTestingModule({});
    const importer = vi
      .fn<() => Promise<typeof CODE>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(CODE);
    const loaded = TestBed.runInInjectionContext(() =>
      TestBed.inject(PhoneCodeService).load(importer),
    );
    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();
    resizeTo(1024, 768);
    TestBed.tick();
    resizeTo(390, 844);
    TestBed.tick();
    await Promise.resolve();

    expect(importer).toHaveBeenCalledTimes(2);
    expect(loaded()).toBe(CODE);
  });
});
