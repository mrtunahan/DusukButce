const { parseReceipt, validateGeometry } = require('../../src/services/parser.service');

describe('parseReceipt', () => {
  test('parses a simple receipt', () => {
    const text = `
BİM A.Ş.
15/05/2026

EKMEK            3,50
SUT 1L           7,25
YUMURTA 10LU    19,90

TOPLAM          30,65
`;
    const result = parseReceipt(text);
    expect(result.market_name).toBe('BİM');
    expect(result.total_amount).toBeCloseTo(30.65);
    expect(result.items.length).toBeGreaterThan(0);
  });
});

describe('validateGeometry', () => {
  test('valid when totals match', () => {
    const items = [
      { line_total: 3.5 },
      { line_total: 7.25 },
      { line_total: 19.9 },
    ];
    const { valid } = validateGeometry(items, 30.65);
    expect(valid).toBe(true);
  });

  test('invalid when totals differ', () => {
    const items = [{ line_total: 10 }];
    const { valid } = validateGeometry(items, 50);
    expect(valid).toBe(false);
  });
});
