import { TestBed } from '@angular/core/testing';
import { SegmentedComponent } from './segmented.component';
import { SegmentedItem } from '../../models/segmented.model';
import { SHARED_TEXTS } from '../../ports';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { at, recordOutput } from '@testing/fixtures/testbed.fixture';
import {
  resizeObserved,
  stubMedia,
  stubObservers,
} from '@testing/doubles/browser.double';

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

const mount = async (items: readonly SegmentedItem[] = ITEMS) => {
  TestBed.configureTestingModule({
    imports: [SegmentedComponent],
    providers: [provideTexts()],
  });

  const fixture = TestBed.createComponent(SegmentedComponent<string>);
  fixture.componentRef.setInput('items', items);
  await fixture.whenStable();

  return { fixture, host: fixture.nativeElement as HTMLElement };
};

const buttonsOf = (host: HTMLElement): HTMLButtonElement[] => [
  ...host.querySelectorAll<HTMLButtonElement>('li button'),
];

const rectsOf = (rects: WeakMap<Element, Partial<DOMRect>>): void => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return (rects.get(this) ?? { left: 0, right: 0 }) as DOMRect;
    },
  );
};

describe('SegmentedComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('lists one <li><button> per item inside a group, in order, its label as its text', async () => {
    const { host } = await mount();

    expect(host.querySelector('ul[role="group"] > li > button')).not.toBeNull();
    expect(
      buttonsOf(host).map((button) =>
        button.querySelector('span')?.textContent?.trim(),
      ),
    ).toEqual(ITEMS.map((item) => item.label));
  });

  it('names the group from the label input, defaulting to the shared selection label', async () => {
    const { host, fixture } = await mount();

    expect(host.querySelector('ul')?.getAttribute('aria-label')).toBe(
      TestBed.inject(SHARED_TEXTS)().segmented.label,
    );

    fixture.componentRef.setInput('label', 'Filtrer les projets');
    await fixture.whenStable();

    expect(host.querySelector('ul')?.getAttribute('aria-label')).toBe(
      'Filtrer les projets',
    );
  });

  it('exposes active state as aria-pressed and data-active on each button', async () => {
    const { host } = await mount();

    expect(
      buttonsOf(host).map((button) => [
        button.getAttribute('aria-pressed'),
        button.dataset['active'],
      ]),
    ).toEqual(ITEMS.map((item) => [String(item.active), String(item.active)]));
  });

  it('names each button from its own aria, falling back to its own label', async () => {
    const { host } = await mount();

    expect(
      buttonsOf(host).map((button) => [
        button.getAttribute('aria-label'),
        button.getAttribute('title'),
      ]),
    ).toEqual([
      ['Tout', 'Tout'],
      ['Projets', 'Projets'],
      ['Notes de veille', 'Notes de veille'],
    ]);
  });

  it('renders the count as a hidden hint next to the label, only when given', async () => {
    const { host } = await mount();
    const buttons = buttonsOf(host);

    expect(at(buttons, 0).querySelector('span[aria-hidden="true"]')).toBeNull();

    const countSpan = at(buttons, 1).querySelector('span[aria-hidden="true"]');
    expect(countSpan).not.toBeNull();
    expect(countSpan?.textContent?.trim()).toBe('07');
    expect(at(buttons, 1).contains(countSpan)).toBe(true);
  });

  it('emits the value of the clicked item, exactly once, on click', async () => {
    const { host, fixture } = await mount();
    const received = recordOutput(fixture.componentInstance.valueChange);

    at(buttonsOf(host), 1).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await fixture.whenStable();

    expect(received).toEqual(['projects']);
  });

  it('keeps two items with the same label apart by their value', async () => {
    const { host, fixture } = await mount([
      { value: 'a', label: 'Même', active: false },
      { value: 'b', label: 'Même', active: false },
    ]);
    const received = recordOutput(fixture.componentInstance.valueChange);

    const buttons = buttonsOf(host);
    at(buttons, 1).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    at(buttons, 0).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();

    expect(buttons).toHaveLength(2);
    expect(received).toEqual(['b', 'a']);
  });

  it('brings the newly active item into view smoothly, once already shown', async () => {
    stubMedia(() => false);
    const observers = stubObservers();
    const rects = new WeakMap<Element, Partial<DOMRect>>();
    rectsOf(rects);
    const { fixture, host } = await mount([
      { value: 'a', label: 'A', active: true },
      { value: 'b', label: 'B', active: false },
    ]);
    const list = host.querySelector('ul') as HTMLElement;
    rects.set(list, { left: 0, right: 100 });
    resizeObserved(observers);
    const scrollBy = vi.fn();
    Object.defineProperty(list, 'scrollBy', {
      value: scrollBy,
      configurable: true,
    });
    rects.set(at(buttonsOf(host), 1), { left: 150, right: 200 });

    fixture.componentRef.setInput('items', [
      { value: 'a', label: 'A', active: false },
      { value: 'b', label: 'B', active: true },
    ]);
    await fixture.whenStable();

    expect(scrollBy).toHaveBeenCalledWith({ left: 100, behavior: 'smooth' });
  });

  it('brings the newly active item into view without animation when instant, even once shown', async () => {
    const observers = stubObservers();
    const rects = new WeakMap<Element, Partial<DOMRect>>();
    rectsOf(rects);
    const { fixture, host } = await mount([
      { value: 'a', label: 'A', active: true },
      { value: 'b', label: 'B', active: false },
    ]);
    fixture.componentRef.setInput('instant', true);
    const list = host.querySelector('ul') as HTMLElement;
    rects.set(list, { left: 0, right: 100 });
    resizeObserved(observers);
    const scrollBy = vi.fn();
    Object.defineProperty(list, 'scrollBy', {
      value: scrollBy,
      configurable: true,
    });
    rects.set(at(buttonsOf(host), 1), { left: 150, right: 200 });

    fixture.componentRef.setInput('items', [
      { value: 'a', label: 'A', active: false },
      { value: 'b', label: 'B', active: true },
    ]);
    await fixture.whenStable();

    expect(scrollBy).toHaveBeenCalledWith({ left: 100, behavior: 'instant' });
  });
});
