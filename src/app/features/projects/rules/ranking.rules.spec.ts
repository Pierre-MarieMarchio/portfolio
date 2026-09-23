import { rank } from './ranking.rules';

const SIX = ['a', 'b', 'c', 'd', 'e', 'f'].map((slug) => ({ slug }));

describe('rank', () => {
  it('ranks and numbers each project from its place in the order', () => {
    expect(
      rank(SIX, 4).map(({ slug, rank: place, number }) => [
        slug,
        place,
        number,
      ]),
    ).toEqual(
      SIX.map(({ slug }, place) => [slug, place, `0${String(place + 1)}`]),
    );
  });

  it('features the first featuredCount projects, and only those', () => {
    expect(rank(SIX, 4).map(({ featured }) => featured)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(rank(SIX, 0).some(({ featured }) => featured)).toBe(false);
    expect(rank(SIX, 12).every(({ featured }) => featured)).toBe(true);
  });

  it('keeps what each project already carries', () => {
    const [first] = rank([{ slug: 'a', title: 'Alpha' }], 1);

    expect(first).toEqual({
      slug: 'a',
      title: 'Alpha',
      rank: 0,
      number: '01',
      featured: true,
    });
  });

  it('ranks nothing out of nothing', () => {
    expect(rank([], 4)).toEqual([]);
  });
});
