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
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('asks for the code once the client starts as a phone, and gives it', async () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const { importer, loaded } = loadOn('browser');

    expect(loaded()).toBeNull();
    TestBed.tick();
    await Promise.resolve();
    TestBed.tick();

    expect(importer).toHaveBeenCalledTimes(1);
    expect(loaded()).toBe(CODE);
  });

  it('never asks for the code of the phone on a tablet or a desktop', async () => {
    stubMedia(TOUCH);
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

  it('asks for the code of the desktop once the client starts as a desktop', async () => {
    stubMedia();
    resizeTo(1280, 800);
    const { importer, loaded } = loadOn('browser', ['desktop']);

    TestBed.tick();
    await Promise.resolve();
    TestBed.tick();

    expect(importer).toHaveBeenCalledTimes(1);
    expect(loaded()).toBe(CODE);
  });

  it('never asks for the code of the desktop on a phone or a tablet', async () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const phone = loadOn('browser', ['desktop']);
    TestBed.tick();
    resizeTo(1024, 768);
    TestBed.tick();
    await Promise.resolve();

    expect(phone.importer).not.toHaveBeenCalled();
    expect(phone.loaded()).toBeNull();
  });

  it('never asks for the code of the desktop on the server, which answers as a desktop', async () => {
    const { importer, loaded } = loadOn('server', ['desktop']);

    TestBed.tick();
    await Promise.resolve();

    expect(importer).not.toHaveBeenCalled();
    expect(loaded()).toBeNull();
  });

  it('asks for the code of the fingers once at a phone or a tablet, and never at a desktop', async () => {
    stubMedia(TOUCH);
    resizeTo(1024, 768);
    const { importer, loaded } = loadOn('browser', ['phone', 'tablet']);
    TestBed.tick();
    resizeTo(390, 844);
    TestBed.tick();
    await Promise.resolve();

    expect(importer).toHaveBeenCalledTimes(1);
    expect(loaded()).toBe(CODE);

    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    stubMedia();
    resizeTo(1280, 800);
    const desktop = loadOn('browser', ['phone', 'tablet']);
    TestBed.tick();
    await Promise.resolve();

    expect(desktop.importer).not.toHaveBeenCalled();
    expect(desktop.loaded()).toBeNull();
  });
});
