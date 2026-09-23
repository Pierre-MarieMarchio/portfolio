import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollMemoryService } from '../services/scroll-memory.service';
import { RememberScrollDirective } from './remember-scroll.directive';

@Component({
  imports: [RememberScrollDirective],
  template: `
    @if (shown()) {
      <div class="zone" [appRememberScroll]="key()" [resetOn]="chapter()">
        <p>content</p>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  public readonly shown = signal(true);
  public readonly key = signal('index');
  public readonly chapter = signal(0);
}

const setup = async (saved: Readonly<Record<string, number>> = {}) => {
  const memory = TestBed.inject(ScrollMemoryService);
  for (const [key, top] of Object.entries(saved)) {
    memory.save(key, top);
  }
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const zone = (): HTMLElement => {
    const found = host.querySelector<HTMLElement>('.zone');
    if (!found) {
      throw new Error('expected the zone');
    }
    return found;
  };
  const scrollTo = (top: number): void => {
    zone().scrollTop = top;
    zone().dispatchEvent(new Event('scroll'));
  };
  return { fixture, memory, zone, scrollTo, host: fixture.componentInstance };
};

describe('RememberScrollDirective', () => {
  it('puts the zone back where it was left under its key', async () => {
    const { zone } = await setup({ index: 120 });

    expect(zone().scrollTop).toBe(120);
  });

  it('remembers where the zone is scrolled to, under its key', async () => {
    const { memory, scrollTo } = await setup();

    scrollTo(80);

    expect(memory.read('index')).toBe(80);
  });

  it('puts the zone where the new key was left when the key changes', async () => {
    const { fixture, host, zone, scrollTo, memory } = await setup({
      'sheet:b': 40,
    });
    scrollTo(80);

    host.key.set('sheet:b');
    await fixture.whenStable();

    expect(zone().scrollTop).toBe(40);
    expect(memory.read('index')).toBe(80);
  });

  it('keeps no memory under an empty key', async () => {
    const { fixture, host, memory, scrollTo } = await setup({ '': 60 });
    host.key.set('');
    await fixture.whenStable();

    scrollTo(90);

    expect(memory.read('')).toBe(60);
  });

  it('goes back to the top when resetOn changes, not when it first arrives', async () => {
    const { fixture, host, zone, scrollTo } = await setup({ index: 120 });
    expect(zone().scrollTop).toBe(120);

    host.chapter.set(1);
    await fixture.whenStable();

    expect(zone().scrollTop).toBe(0);
    scrollTo(30);
    host.chapter.set(1);
    await fixture.whenStable();
    expect(zone().scrollTop).toBe(30);
  });

  it('lets the new key win when the key and resetOn change together', async () => {
    const { fixture, host, zone } = await setup({ 'sheet:b': 40 });

    host.key.set('sheet:b');
    host.chapter.set(1);
    await fixture.whenStable();

    expect(zone().scrollTop).toBe(40);
  });

  it('finds its place again when the zone comes back', async () => {
    const { fixture, host, zone, scrollTo } = await setup();
    scrollTo(70);

    host.shown.set(false);
    await fixture.whenStable();
    host.shown.set(true);
    await fixture.whenStable();

    expect(zone().scrollTop).toBe(70);
  });

  it('stops remembering once its zone goes', async () => {
    const { fixture, host, zone, memory } = await setup();
    const gone = zone();

    host.shown.set(false);
    await fixture.whenStable();
    gone.scrollTop = 90;
    gone.dispatchEvent(new Event('scroll'));

    expect(memory.read('index')).toBe(0);
  });
});
