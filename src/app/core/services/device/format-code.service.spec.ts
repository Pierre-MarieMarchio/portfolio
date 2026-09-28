import { TestBed } from '@angular/core/testing';
import type { DisplayFormat } from '../../models/display-format.model';
import { FormatCodeService } from './format-code.service';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';
import { onPlatform, Platform } from '@testing/fixtures/testbed.fixture';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

const CODE = { name: 'format code' };

const loadOn = (
  platform: Platform,
  formats: readonly DisplayFormat[] = ['phone'],
) => {
  onPlatform(platform);
  const importer = vi.fn(() => Promise.resolve(CODE));
  const loaded = TestBed.runInInjectionContext(() =>
    TestBed.inject(FormatCodeService).load(formats, importer),
  );
  return { importer, loaded };
};

describe('FormatCodeService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each<{
    case: string;
    formats: readonly DisplayFormat[];
    touch: boolean;
    width: number;
    height: number;
  }>([
    {
      case: 'the phone once the client starts as a phone',
      formats: ['phone'],
      touch: true,
      width: 390,
      height: 844,
    },
    {
      case: 'the desktop once the client starts as a desktop',
      formats: ['desktop'],
      touch: false,
      width: 1280,
      height: 800,
    },
  ])(
    'asks for the code of $case, and gives it',
    async ({ formats, touch, width, height }) => {
      stubMedia(touch ? TOUCH : undefined);
      resizeTo(width, height);
      const { importer, loaded } = loadOn('browser', formats);

      expect(loaded()).toBeNull();
      TestBed.tick();
      await Promise.resolve();
      TestBed.tick();

      expect(importer).toHaveBeenCalledTimes(1);
      expect(loaded()).toBe(CODE);
    },
  );

  it.each<{
    case: string;
    formats: readonly DisplayFormat[];
    touch: boolean;
    width: number;
    height: number;
  }>([
    {
      case: 'the phone on a tablet',
      formats: ['phone'],
      touch: true,
      width: 1024,
      height: 768,
    },
    {
      case: 'the phone on a desktop',
      formats: ['phone'],
      touch: false,
      width: 1440,
      height: 900,
    },
    {
      case: 'the desktop on a phone',
      formats: ['desktop'],
      touch: true,
      width: 390,
      height: 844,
    },
    {
      case: 'the desktop on a tablet',
      formats: ['desktop'],
      touch: true,
      width: 1024,
      height: 768,
    },
    {
      case: 'the fingers on a desktop',
      formats: ['phone', 'tablet'],
      touch: false,
      width: 1280,
      height: 800,
    },
  ])(
    'never asks for the code of $case',
    async ({ formats, touch, width, height }) => {
      stubMedia(touch ? TOUCH : undefined);
      resizeTo(width, height);
      const { importer, loaded } = loadOn('browser', formats);
      TestBed.tick();
      await Promise.resolve();

      expect(importer).not.toHaveBeenCalled();
      expect(loaded()).toBeNull();
    },
  );

  it.each<{ case: string; formats: readonly DisplayFormat[] }>([
    { case: 'the phone, even at a phone size', formats: ['phone'] },
    { case: 'the desktop, which it answers as', formats: ['desktop'] },
    { case: 'the fingers, even at a phone size', formats: ['phone', 'tablet'] },
  ])('never asks for the code of $case on the server', async ({ formats }) => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const { importer, loaded } = loadOn('server', formats);

    TestBed.tick();
    await Promise.resolve();

    expect(importer).not.toHaveBeenCalled();
    expect(loaded()).toBeNull();
  });

  it('asks for it when the format turns to phone, and only once', async () => {
    stubMedia(TOUCH);
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
    stubMedia(TOUCH);
    resizeTo(390, 844);
    TestBed.configureTestingModule({});
    const importer = vi
      .fn<() => Promise<typeof CODE>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(CODE);
    const loaded = TestBed.runInInjectionContext(() =>
      TestBed.inject(FormatCodeService).load(['phone'], importer),
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

  it('asks for the code of the fingers only once, from a tablet to a phone', async () => {
    stubMedia(TOUCH);
    resizeTo(1024, 768);
    const { importer, loaded } = loadOn('browser', ['phone', 'tablet']);
    TestBed.tick();
    resizeTo(390, 844);
    TestBed.tick();
    await Promise.resolve();

    expect(importer).toHaveBeenCalledTimes(1);
    expect(loaded()).toBe(CODE);
  });
});
