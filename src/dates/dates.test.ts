import { describe, expect, it } from 'vitest';
import { CalendarDate } from '@internationalized/date';
import {
  clampDate,
  clampRange,
  eachDay,
  formatRange,
  isWeekend,
  isWithin,
  monthRange,
  orderRange,
  rangeLength,
  rangesOverlap,
  sameRange,
  weekRange,
} from './dates';

const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);
const JULY = { start: d(2026, 7, 10), end: d(2026, 7, 20) };

describe('inside a span', () => {
  it('counts both ends', () => {
    expect(isWithin(d(2026, 7, 10), JULY)).toBe(true);
    expect(isWithin(d(2026, 7, 20), JULY)).toBe(true);
    expect(isWithin(d(2026, 7, 15), JULY)).toBe(true);
    expect(isWithin(d(2026, 7, 9), JULY)).toBe(false);
    expect(isWithin(d(2026, 7, 21), JULY)).toBe(false);
  });

  it('works across a month and a year boundary', () => {
    const span = { start: d(2026, 12, 28), end: d(2027, 1, 3) };
    expect(isWithin(d(2027, 1, 1), span)).toBe(true);
    expect(isWithin(d(2026, 12, 27), span)).toBe(false);
  });
});

describe('clamping', () => {
  it('pulls a date inside the limits and leaves one that is already inside', () => {
    expect(clampDate(d(2026, 7, 1), d(2026, 7, 10), d(2026, 7, 20)).toString()).toBe('2026-07-10');
    expect(clampDate(d(2026, 7, 31), d(2026, 7, 10), d(2026, 7, 20)).toString()).toBe('2026-07-20');
    expect(clampDate(d(2026, 7, 15), d(2026, 7, 10), d(2026, 7, 20)).toString()).toBe('2026-07-15');
  });

  it('takes one limit or neither', () => {
    expect(clampDate(d(2026, 7, 1), d(2026, 7, 10)).toString()).toBe('2026-07-10');
    expect(clampDate(d(2026, 7, 1), undefined, d(2026, 7, 20)).toString()).toBe('2026-07-01');
    expect(clampDate(d(2026, 7, 1)).toString()).toBe('2026-07-01');
  });

  it('pulls both ends of a span in', () => {
    const clamped = clampRange({ start: d(2026, 6, 1), end: d(2026, 8, 1) }, d(2026, 7, 1), d(2026, 7, 31));
    expect(clamped.start.toString()).toBe('2026-07-01');
    expect(clamped.end.toString()).toBe('2026-07-31');
  });
});

describe('ordering', () => {
  it('puts a backwards span the right way round, which a drag can produce', () => {
    const backwards = { start: d(2026, 7, 20), end: d(2026, 7, 10) };
    expect(orderRange(backwards).start.toString()).toBe('2026-07-10');
    expect(orderRange(backwards).end.toString()).toBe('2026-07-20');
  });

  it('leaves one that is already in order alone', () => {
    expect(orderRange(JULY)).toEqual(JULY);
  });
});

describe('overlapping', () => {
  it('is true when they share any day, including only one', () => {
    expect(rangesOverlap(JULY, { start: d(2026, 7, 20), end: d(2026, 7, 25) })).toBe(true);
    expect(rangesOverlap(JULY, { start: d(2026, 7, 15), end: d(2026, 7, 16) })).toBe(true);
  });

  it('is false when they only touch at a gap', () => {
    expect(rangesOverlap(JULY, { start: d(2026, 7, 21), end: d(2026, 7, 25) })).toBe(false);
    expect(rangesOverlap(JULY, { start: d(2026, 6, 1), end: d(2026, 7, 9) })).toBe(false);
  });

  it('does not care which way round either span is given', () => {
    const backwards = { start: d(2026, 7, 25), end: d(2026, 7, 20) };
    expect(rangesOverlap(JULY, orderRange(backwards))).toBe(true);
  });
});

describe('length', () => {
  it('counts both ends, so one day is one', () => {
    expect(rangeLength({ start: d(2026, 7, 10), end: d(2026, 7, 10) })).toBe(1);
    expect(rangeLength(JULY)).toBe(11);
  });

  it('is right across a month, a year and a leap day', () => {
    expect(rangeLength({ start: d(2026, 1, 31), end: d(2026, 2, 1) })).toBe(2);
    expect(rangeLength({ start: d(2026, 12, 31), end: d(2027, 1, 1) })).toBe(2);
    // 2028 is a leap year, so February has 29 days.
    expect(rangeLength({ start: d(2028, 2, 1), end: d(2028, 3, 1) })).toBe(30);
  });

  it('does not care which way round it is given', () => {
    expect(rangeLength({ start: d(2026, 7, 20), end: d(2026, 7, 10) })).toBe(11);
  });
});

describe('every day in a span', () => {
  it('runs from one end to the other inclusively', () => {
    const days = eachDay({ start: d(2026, 7, 10), end: d(2026, 7, 13) });
    expect(days.map((day) => day.toString())).toEqual([
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
    ]);
  });

  it('gives one day for a span of one', () => {
    expect(eachDay({ start: d(2026, 7, 10), end: d(2026, 7, 10) })).toHaveLength(1);
  });

  it('agrees with rangeLength', () => {
    expect(eachDay(JULY)).toHaveLength(rangeLength(JULY));
  });
});

describe('whole months and weeks', () => {
  it('covers the month a date falls in', () => {
    const month = monthRange(d(2026, 7, 15));
    expect(month.start.toString()).toBe('2026-07-01');
    expect(month.end.toString()).toBe('2026-07-31');
    expect(rangeLength(month)).toBe(31);
  });

  it('gets February right in a leap year and out of one', () => {
    expect(rangeLength(monthRange(d(2026, 2, 10)))).toBe(28);
    expect(rangeLength(monthRange(d(2028, 2, 10)))).toBe(29);
  });

  it('starts the week where the locale starts it', () => {
    // 15 July 2026 is a Wednesday.
    const us = weekRange(d(2026, 7, 15), 'en-US');
    const gb = weekRange(d(2026, 7, 15), 'en-GB');
    // Sunday in the United States, Monday in Britain — which is why the locale is not optional.
    expect(us.start.toString()).toBe('2026-07-12');
    expect(gb.start.toString()).toBe('2026-07-13');
    expect(rangeLength(us)).toBe(7);
    expect(rangeLength(gb)).toBe(7);
  });
});

describe('weekends and equality', () => {
  it('knows a Saturday from a Wednesday, and says only that', () => {
    expect(isWeekend(d(2026, 7, 18))).toBe(true);
    expect(isWeekend(d(2026, 7, 19))).toBe(true);
    expect(isWeekend(d(2026, 7, 15))).toBe(false);
    /*
     * Saturday and Sunday specifically. "The days this locale treats as a weekend" would be
     * Friday and Saturday in much of the Middle East, and Intl exposes no way to ask — so the
     * function does not take a locale it would have to ignore.
     */
  });

  it('compares two spans by their days', () => {
    expect(sameRange(JULY, { start: d(2026, 7, 10), end: d(2026, 7, 20) })).toBe(true);
    expect(sameRange(JULY, { start: d(2026, 7, 10), end: d(2026, 7, 21) })).toBe(false);
  });
});

describe('writing a span out', () => {
  it('collapses the parts the two ends share, which no string joining gets right', () => {
    const text = formatRange(JULY, 'en-GB');
    // "10–20 Jul 2026" rather than "10 Jul 2026 – 20 Jul 2026".
    expect(text).toMatch(/2026/);
    expect(text.match(/2026/g)).toHaveLength(1);
  });

  it('spells it out when the ends share nothing', () => {
    const text = formatRange({ start: d(2026, 12, 30), end: d(2027, 1, 2) }, 'en-GB');
    expect(text).toMatch(/2026/);
    expect(text).toMatch(/2027/);
  });

  it('follows the locale', () => {
    const gb = formatRange(JULY, 'en-GB');
    const us = formatRange(JULY, 'en-US');
    expect(gb).not.toBe(us);
  });

  it('puts a backwards span the right way round first', () => {
    expect(formatRange({ start: d(2026, 7, 20), end: d(2026, 7, 10) }, 'en-GB')).toBe(
      formatRange(JULY, 'en-GB'),
    );
  });
});
