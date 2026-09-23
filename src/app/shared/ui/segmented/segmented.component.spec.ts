import { TestBed } from '@angular/core/testing';
import { SegmentedComponent } from './segmented.component';
import { SegmentedItem } from './segmented.model';

const ITEMS: readonly SegmentedItem[] = [
  { value: 'all', label: 'Tout', active: true },
  { value: 'projects', label: 'Projets', count: '07', active: false },
  {
    value: 'notes',
    label: 'Notes',
    count: '02',
    active: false,
    aria: 'Notes de veille',
  },
];

/** Indexed access with `noUncheckedIndexedAccess`: fail loudly, not with `undefined`. */
const at = <T>(items: readonly T[], index: number): T => {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`expected an item at index ${String(index)}, found none`);
  }
  return item;
};

describe('SegmentedComponent', () => {
  const mount = async (items: readonly SegmentedItem[] = ITEMS) => {
    TestBed.configureTestingModule({ imports: [SegmentedComponent] });

    const fixture = TestBed.createComponent(SegmentedComponent<string>);
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();

    return { fixture, host: fixture.nativeElement as HTMLElement };
  };

  const buttonsOf = (host: HTMLElement): HTMLButtonElement[] =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('li button'));

  it('lists one <li><button> per item, in order, inside a group', async () => {
    const { host } = await mount();

    const group = host.querySelector('ul[role="group"]');
    const items = Array.from(host.querySelectorAll('li'));

    expect(group).not.toBeNull();
    expect(items).toHaveLength(3);
    items.forEach((item) => {
      expect(item.querySelector('button')).not.toBeNull();
    });
  });

  it('names the group from the label input, defaulting to "Sélection"', async () => {
    const { host, fixture } = await mount();

    expect(host.querySelector('ul')?.getAttribute('aria-label')).toBe(
      'Sélection',
    );

    fixture.componentRef.setInput('label', 'Filtrer les projets');
    await fixture.whenStable();

    expect(host.querySelector('ul')?.getAttribute('aria-label')).toBe(
      'Filtrer les projets',
    );
  });

  it('exposes active state as aria-pressed and data-active on each button', async () => {
    const { host } = await mount();
    const buttons = buttonsOf(host);

    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['true', 'false', 'false']);
    expect(buttons.map((button) => button.getAttribute('data-active'))).toEqual(
      ['true', 'false', 'false'],
    );
  });

  it('names each button from its own aria, falling back to its own label', async () => {
    const { host } = await mount();
    const buttons = buttonsOf(host);

    // First two items have no `aria`: the accessible name falls back to
    // their own `label` (not the group's).
    expect(at(buttons, 0).getAttribute('aria-label')).toBe('Tout');
    expect(at(buttons, 0).getAttribute('title')).toBe('Tout');
    expect(at(buttons, 1).getAttribute('aria-label')).toBe('Projets');
    expect(at(buttons, 1).getAttribute('title')).toBe('Projets');

    // The third item carries its own `aria`, which wins over its `label`.
    expect(at(buttons, 2).getAttribute('aria-label')).toBe('Notes de veille');
    expect(at(buttons, 2).getAttribute('title')).toBe('Notes de veille');
  });

  it('shows the label as the button text', async () => {
    const { host } = await mount();
    const buttons = buttonsOf(host);

    expect(at(buttons, 0).textContent).toContain('Tout');
    expect(at(buttons, 1).textContent).toContain('Projets');
    expect(at(buttons, 2).textContent).toContain('Notes');
  });

  it('renders the count as a hidden hint next to the label, only when given', async () => {
    const { host } = await mount();
    const buttons = buttonsOf(host);

    // No `count` on the first item: no hidden span at all.
    expect(at(buttons, 0).querySelector('span[aria-hidden="true"]')).toBeNull();

    // A `count` on the second item: a hidden span carries it, inside the button.
    const countSpan = at(buttons, 1).querySelector('span[aria-hidden="true"]');
    expect(countSpan).not.toBeNull();
    expect(countSpan?.textContent?.trim()).toBe('07');
    expect(at(buttons, 1).contains(countSpan)).toBe(true);
  });

  it('emits the value of the clicked item, exactly once, on click', async () => {
    const { host, fixture } = await mount();
    const buttons = buttonsOf(host);

    const received: string[] = [];
    fixture.componentInstance.chosen.subscribe((value: string) => {
      received.push(value);
    });

    at(buttons, 1).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();

    expect(received).toEqual(['projects']);

    at(buttons, 1).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();

    expect(received).toEqual(['projects', 'projects']);
  });

  /** Two choices may share a label; their values tell them apart. */
  it('keeps two items with the same label apart by their value', async () => {
    const { host, fixture } = await mount([
      { value: 'a', label: 'Même', active: false },
      { value: 'b', label: 'Même', active: false },
    ]);
    const received: string[] = [];
    fixture.componentInstance.chosen.subscribe((value: string) => {
      received.push(value);
    });

    const buttons = buttonsOf(host);
    at(buttons, 1).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    at(buttons, 0).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();

    expect(buttons).toHaveLength(2);
    expect(received).toEqual(['b', 'a']);
  });

  it('renders an empty group without error when items is empty', async () => {
    const { host } = await mount([]);

    expect(host.querySelectorAll('li')).toHaveLength(0);
    expect(host.querySelector('ul[role="group"]')).not.toBeNull();
  });
});
