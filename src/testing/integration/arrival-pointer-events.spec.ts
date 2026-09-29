import { compileString } from 'sass';

const compile = (scss: string): string =>
  compileString(scss, { loadPaths: ['src/assets/styles'] })
    .css.replaceAll(/\s+/g, ' ')
    .trim();

describe('arrival mixins compiled to CSS', () => {
  it('keeps a held command out of reach, without hiding it from layout', () => {
    const css = compile(`
      @use 'mixins/arrival';
      :host([data-arrival='held']) { @include arrival.held; }
    `);

    expect(css).toContain('pointer-events: none;');
    expect(css).not.toContain('visibility: hidden;');
  });

  it('still hides a held command that opts into it', () => {
    const css = compile(`
      @use 'mixins/arrival';
      :host([data-arrival='held']) { @include arrival.held($hide: true); }
    `);

    expect(css).toContain('visibility: hidden;');
  });

  it('takes the gesture only from the first frame of its own appearance', () => {
    const css = compile(`
      @use 'mixins/arrival';
      :host([data-arrival='shown']) { @include arrival.shown(1300ms, 400ms); }
    `);
    const start = css.indexOf(':host([data-arrival=shown])');
    const hostRule = css.slice(start, css.indexOf('}', start) + 1);

    expect(hostRule).toContain('pointer-events: none;');
    expect(hostRule).not.toContain('pointer-events: auto;');
    expect(hostRule).toContain(
      'animation: rise 1300ms 400ms both, reach 0s 400ms forwards;',
    );
    expect(css).toContain('@keyframes reach { to { pointer-events: auto; } }');
  });

  it('delays the gesture by the same offset a later command was given', () => {
    const css = compile(`
      @use 'mixins/arrival';
      :host([data-arrival='shown']) { @include arrival.shown(1200ms, 800ms); }
    `);

    expect(css).toContain('reach 0s 800ms forwards');
  });

  it('takes the gesture at once with less motion, since no animation ever reaches it', () => {
    const css = compile(`
      @use 'mixins/arrival';
      :host([data-arrival='shown']) { @include arrival.shown(1300ms, 400ms); }
    `);

    expect(css).toContain(
      '@media (prefers-reduced-motion: reduce) { :host([data-arrival=shown]) { pointer-events: auto; } }',
    );
  });
});
