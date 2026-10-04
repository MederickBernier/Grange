import { describe, expect, it } from 'vitest';
import {
  OPERATORS,
  aggregate,
  filterItems,
  getField,
  groupItems,
  isUnary,
  matches,
  passes,
  query,
  sortItems,
  type CompositeFilter,
} from '../index';

interface Row {
  name: string;
  city: string;
  score: number | null;
  joined?: Date;
  active?: boolean;
  profile?: { tag?: string };
}

const rows: Row[] = [
  {
    name: 'Ada',
    city: 'London',
    score: 90,
    joined: new Date('2026-01-10'),
    active: true,
    profile: { tag: 'x' },
  },
  { name: 'Älva', city: 'Oslo', score: 70, joined: new Date('2026-03-02'), active: false },
  { name: 'Grace', city: 'London', score: null, joined: new Date('2025-11-30'), active: true },
  { name: 'alan', city: 'Zurich', score: 85, active: false },
];

describe('getField', () => {
  it('reads a path, not only a key', () => {
    expect(getField(rows[0], 'profile.tag')).toBe('x');
  });

  it('gives undefined rather than throwing on a missing branch', () => {
    expect(getField(rows[1], 'profile.tag')).toBeUndefined();
    expect(getField(null, 'a.b')).toBeUndefined();
  });
});

describe('matches', () => {
  it('ignores case by default, which is what a person filtering a table expects', () => {
    expect(matches(rows[3], { field: 'name', operator: 'contains', value: 'ALA' })).toBe(true);
    expect(matches(rows[3], { field: 'name', operator: 'contains', value: 'ALA', ignoreCase: false })).toBe(
      false,
    );
  });

  it('handles the text operators', () => {
    expect(matches(rows[0], { field: 'name', operator: 'startswith', value: 'Ad' })).toBe(true);
    expect(matches(rows[0], { field: 'name', operator: 'endswith', value: 'da' })).toBe(true);
    expect(matches(rows[0], { field: 'name', operator: 'doesnotcontain', value: 'zz' })).toBe(true);
  });

  it('treats null and empty string as empty, and nothing else', () => {
    expect(matches(rows[2], { field: 'score', operator: 'isempty' })).toBe(true);
    expect(matches(rows[0], { field: 'score', operator: 'isnotempty' })).toBe(true);
    expect(matches({ score: 0 }, { field: 'score', operator: 'isempty' })).toBe(false);
  });

  it('compares numbers as numbers, not as strings', () => {
    // '9' > '85' as strings; 9 is not greater than 85 as numbers.
    expect(matches({ n: 9 }, { field: 'n', operator: 'gt', value: 85 })).toBe(false);
  });

  it('compares dates by their instant', () => {
    expect(matches(rows[0], { field: 'joined', operator: 'lt', value: new Date('2026-02-01') })).toBe(true);
  });

  it('never lets an absent value satisfy an ordered comparison', () => {
    // Absent is not small. A null score must not count as 0 and slip under "less than 50".
    expect(matches(rows[2], { field: 'score', operator: 'lt', value: 50 })).toBe(false);
    expect(matches(rows[2], { field: 'score', operator: 'gt', value: 50 })).toBe(false);
  });

  it('compares booleans', () => {
    expect(matches(rows[0], { field: 'active', operator: 'eq', value: true })).toBe(true);
    expect(matches(rows[1], { field: 'active', operator: 'neq', value: true })).toBe(true);
  });
});

describe('passes', () => {
  const composite: CompositeFilter = {
    logic: 'and',
    filters: [
      { field: 'city', operator: 'eq', value: 'London' },
      {
        logic: 'or',
        filters: [
          { field: 'score', operator: 'gt', value: 80 },
          { field: 'name', operator: 'eq', value: 'Grace' },
        ],
      },
    ],
  };

  it('walks a nested tree', () => {
    expect(rows.filter((row) => passes(row, composite)).map((row) => row.name)).toEqual(['Ada', 'Grace']);
  });

  it('matches everything on an empty group, so an unfinished filter hides nothing', () => {
    expect(passes(rows[0], { logic: 'and', filters: [] })).toBe(true);
  });

  it('matches everything with no filter at all', () => {
    expect(passes(rows[0], undefined)).toBe(true);
  });
});

describe('filterItems', () => {
  it('leaves the source array alone', () => {
    const before = [...rows];
    filterItems(rows, { field: 'city', operator: 'eq', value: 'London' });
    expect(rows).toEqual(before);
  });
});

describe('sortItems', () => {
  it('collates rather than comparing code points', () => {
    // 'Ä' sorts with 'A' in a collator and after 'Z' with a plain <.
    expect(sortItems(rows, [{ field: 'name' }], 'en').map((row) => row.name)).toEqual([
      'Ada',
      'alan',
      'Älva',
      'Grace',
    ]);
  });

  it('sorts numbers inside strings the way a reader reads them', () => {
    const items = [{ n: 'item 10' }, { n: 'item 9' }];
    expect(sortItems(items, [{ field: 'n' }]).map((i) => i.n)).toEqual(['item 9', 'item 10']);
  });

  it('puts absent values last whichever way the column points', () => {
    expect(sortItems(rows, [{ field: 'score' }]).map((row) => row.score)).toEqual([70, 85, 90, null]);
    expect(sortItems(rows, [{ field: 'score', direction: 'desc' }]).map((row) => row.score)).toEqual([
      90,
      85,
      70,
      null,
    ]);
  });

  it('breaks ties with the next field, and is stable after that', () => {
    const sorted = sortItems(rows, [{ field: 'city' }, { field: 'name' }], 'en');
    expect(sorted.map((row) => row.name)).toEqual(['Ada', 'Grace', 'Älva', 'alan']);
  });

  it('leaves the source array alone', () => {
    const before = rows.map((row) => row.name);
    sortItems(rows, [{ field: 'name' }]);
    expect(rows.map((row) => row.name)).toEqual(before);
  });
});

describe('aggregate', () => {
  it('counts rows, including the ones with no value', () => {
    expect(aggregate(rows, { field: 'score', kind: 'count' })).toBe(4);
  });

  it('ignores rows with no value for the rest', () => {
    expect(aggregate(rows, { field: 'score', kind: 'sum' })).toBe(245);
    expect(aggregate(rows, { field: 'score', kind: 'average' })).toBeCloseTo(245 / 3);
    expect(aggregate(rows, { field: 'score', kind: 'min' })).toBe(70);
    expect(aggregate(rows, { field: 'score', kind: 'max' })).toBe(90);
  });

  it('gives zero rather than NaN or Infinity when there is nothing to work with', () => {
    expect(aggregate([], { field: 'score', kind: 'sum' })).toBe(0);
    expect(aggregate([], { field: 'score', kind: 'min' })).toBe(0);
  });
});

describe('groupItems', () => {
  it('keeps the order the rows arrived in', () => {
    expect(groupItems(rows, 'city').map((group) => group.value)).toEqual(['London', 'Oslo', 'Zurich']);
  });

  it('aggregates within each group', () => {
    const groups = groupItems(rows, 'city', [{ field: 'score', kind: 'sum' }]);
    expect(groups[0]!.aggregates).toEqual({ 'score:sum': 90 });
  });
});

describe('query', () => {
  it('filters, then sorts, then pages', () => {
    const result = query(rows, {
      filter: { field: 'score', operator: 'isnotempty' },
      sort: [{ field: 'score', direction: 'desc' }],
      skip: 1,
      take: 1,
    });
    expect(result.items.map((row) => row.name)).toEqual(['alan']);
  });

  it('counts what matched, not what is on the page', () => {
    // A total that changes as you page is not a total, and a pager reads this.
    const result = query(rows, { filter: { field: 'city', operator: 'eq', value: 'London' }, take: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('aggregates over everything that matched, not over the page', () => {
    const result = query(rows, { take: 1, aggregates: [{ field: 'score', kind: 'sum' }] });
    expect(result.aggregates).toEqual({ 'score:sum': 245 });
  });

  it('returns everything when asked for nothing in particular', () => {
    expect(query(rows).items).toHaveLength(4);
    expect(query(rows).groups).toBeUndefined();
  });
});

describe('the operator set', () => {
  it('offers the text operators only where they mean something', () => {
    const keys = (type: 'text' | 'number') => OPERATORS[type].map((spec) => spec.key);
    expect(keys('text')).toContain('contains');
    // "Contains" on a number is a filter row nobody wrote on purpose.
    expect(keys('number')).not.toContain('contains');
  });

  it('words the ordered operators for the type they are on', () => {
    expect(OPERATORS.date.find((spec) => spec.key === 'gt')?.label).toBe('Is after');
    expect(OPERATORS.number.find((spec) => spec.key === 'gt')?.label).toBe('Is greater than');
  });

  it('knows which operators take no value', () => {
    expect(isUnary('isempty')).toBe(true);
    expect(isUnary('eq')).toBe(false);
  });

  it('only offers operators the query can actually run', () => {
    for (const specs of Object.values(OPERATORS)) {
      for (const spec of specs) {
        // Every one of them has to produce a boolean rather than fall through.
        expect(typeof matches({ a: 1 }, { field: 'a', operator: spec.key, value: 1 })).toBe('boolean');
      }
    }
  });
});
