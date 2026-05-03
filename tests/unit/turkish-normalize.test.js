const { normalize, extractUnit, tokenize, jaccard } = require('../../src/utils/turkish-normalize');

describe('normalize', () => {
  test('converts Turkish chars', () => {
    expect(normalize('İçim Süt')).toBe('icim sut');
  });
  test('removes special chars', () => {
    expect(normalize('abc!@#123')).toBe('abc 123');
  });
});

describe('extractUnit', () => {
  test('extracts litre', () => {
    expect(extractUnit('Süt 1L')).toEqual({ size: 1, unit: 'L' });
  });
  test('extracts gram', () => {
    expect(extractUnit('Peynir 200gr')).toEqual({ size: 200, unit: 'G' });
  });
  test('returns null when no unit', () => {
    expect(extractUnit('Ekmek')).toEqual({ size: null, unit: null });
  });
});

describe('jaccard', () => {
  test('identical sets', () => {
    expect(jaccard(['a', 'b'], ['a', 'b'])).toBe(1);
  });
  test('disjoint sets', () => {
    expect(jaccard(['a'], ['b'])).toBe(0);
  });
  test('partial overlap', () => {
    expect(jaccard(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3);
  });
});
