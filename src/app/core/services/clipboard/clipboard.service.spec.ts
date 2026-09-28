import { ClipboardService } from './clipboard.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

const stubClipboard = (writeText: (text: string) => Promise<void>) => {
  const clipboard = { writeText: vi.fn(writeText) };
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  });
  return clipboard;
};

describe('ClipboardService', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('is inert on the server: copies nothing', async () => {
    const clipboard = stubClipboard(() => Promise.resolve());

    const isCopied = await injectOn(ClipboardService, 'server').copy('a@b.c');

    expect(isCopied).toBe(false);
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('writes the text to the clipboard in the browser, and says so', async () => {
    const clipboard = stubClipboard(() => Promise.resolve());

    const isCopied = await injectOn(ClipboardService, 'browser').copy('a@b.c');

    expect(isCopied).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledWith('a@b.c');
  });

  it('says it did not copy when the browser refuses', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')));

    expect(await injectOn(ClipboardService, 'browser').copy('a@b.c')).toBe(
      false,
    );
  });

  it('says it did not copy where the browser has no clipboard', async () => {
    expect(await injectOn(ClipboardService, 'browser').copy('a@b.c')).toBe(
      false,
    );
  });
});
