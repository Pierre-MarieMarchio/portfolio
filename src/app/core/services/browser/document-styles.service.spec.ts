import { DocumentStylesService } from './document-styles.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('DocumentStylesService', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--probe');
    Reflect.deleteProperty(document, 'fonts');
    vi.restoreAllMocks();
  });

  it('is inert on the server: no token, no duration, no fonts', () => {
    document.documentElement.style.setProperty('--probe', '8700ms');
    const computed = vi.spyOn(window, 'getComputedStyle');
    const styles = injectOn(DocumentStylesService, 'server');
    const onFonts = vi.fn();

    expect(styles.token('--probe')).toBe('');
    expect(styles.token('opacity', document.body)).toBe('');
    expect(styles.duration('--probe')).toBeNull();
    styles.fontsReady(onFonts);

    expect(computed).not.toHaveBeenCalled();
    expect(onFonts).not.toHaveBeenCalled();
  });

  it('reads a root token, or an element style, trimmed, in the browser', () => {
    document.documentElement.style.setProperty('--probe', ' #2b2f3a ');
    const element = document.createElement('div');
    element.style.opacity = '0.5';
    document.body.append(element);
    const styles = injectOn(DocumentStylesService, 'browser');

    expect(styles.token('--probe')).toBe('#2b2f3a');
    expect(styles.token('opacity', element)).toBe('0.5');
    element.remove();
  });

  it('reads a duration token in ms or s, and nothing else, in the browser', () => {
    const styles = injectOn(DocumentStylesService, 'browser');
    const read = (value: string): number | null => {
      document.documentElement.style.setProperty('--probe', value);
      return styles.duration('--probe');
    };

    expect(read('8700ms')).toBe(8700);
    expect(read('5.6s')).toBe(5600);
    expect(read('auto')).toBeNull();
    document.documentElement.style.removeProperty('--probe');
    expect(styles.duration('--probe')).toBeNull();
  });

  it('calls back once the fonts are ready, in the browser', async () => {
    const ready = Promise.resolve();
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready },
    });
    const onFonts = vi.fn();

    injectOn(DocumentStylesService, 'browser').fontsReady(onFonts);
    await ready;

    expect(onFonts).toHaveBeenCalledTimes(1);
  });
});
